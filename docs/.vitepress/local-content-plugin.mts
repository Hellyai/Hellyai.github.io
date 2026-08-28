import type { IncomingMessage, ServerResponse } from 'node:http'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { accessSync, constants as fsConstants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { build } from 'vitepress'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const docsRoot = path.resolve(currentDir, '..')
const projectRoot = path.resolve(docsRoot, '..')
const backupRoot = path.join(projectRoot, '.content-backups')
const homeConfigFile = path.join(currentDir, 'home-config.json')
const execFileAsync = promisify(execFile)
const sections = {
  work: { dir: 'work', label: '工作作品' }, agents: { dir: 'agents', label: 'Agent 指令' },
  skills: { dir: 'skills', label: 'Skill 技能' }
} as const
type SectionKey = keyof typeof sections
type UploadImage = { name: string; type: string; data: string }
type GitSyncResult = { status: 'synced' | 'skipped' | 'failed'; message: string }
type GitRepositoryStatus = {
  available: boolean; connected: boolean; branch: string; ahead: number; behind: number; dirty: boolean
  state: 'synced' | 'ahead' | 'behind' | 'diverged' | 'unavailable'; message: string
}

async function runGit(args: string[]) {
  return execFileAsync('git', args, { cwd: projectRoot, windowsHide: true, timeout: 60_000 })
}
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))
function gitErrorDetail(error: unknown) {
  if (!error || typeof error !== 'object') return '未知错误'
  const stderr = 'stderr' in error ? String(error.stderr ?? '').trim() : ''
  const message = error instanceof Error ? error.message.trim() : ''
  return (stderr || message || '未知错误').split(/\r?\n/)[0]
}
function isTransientGitError(error: unknown) {
  return /connect|connection|recv failure|reset|timed?\s*out|resolve host|network|ssl|tls|http\/2/i.test(gitErrorDetail(error))
}
async function pushWithRetry(branch: string, attempts = 3) {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await runGit(['push', 'origin', branch]) }
    catch (error) {
      lastError = error
      if (attempt === attempts || !isTransientGitError(error)) throw error
      await delay(attempt * 900)
    }
  }
  throw lastError
}
async function getGitStatus(): Promise<GitRepositoryStatus> {
  try {
    await runGit(['rev-parse', '--is-inside-work-tree'])
    const branch = (await runGit(['branch', '--show-current'])).stdout.trim() || 'main'
    const dirty = Boolean((await runGit(['status', '--porcelain'])).stdout.trim())
    try { await runGit(['remote', 'get-url', 'origin']) }
    catch { return { available: true, connected: false, branch, ahead: 0, behind: 0, dirty, state: 'unavailable', message: '尚未连接 GitHub 仓库。' } }
    let ahead = 0; let behind = 0
    try {
      const counts = (await runGit(['rev-list', '--left-right', '--count', `${branch}...origin/${branch}`])).stdout.trim().split(/\s+/).map(Number)
      ahead = Number.isFinite(counts[0]) ? counts[0] : 0; behind = Number.isFinite(counts[1]) ? counts[1] : 0
    } catch { /* 首次推送前可能还没有远端跟踪分支。 */ }
    const state = ahead && behind ? 'diverged' : ahead ? 'ahead' : behind ? 'behind' : 'synced'
    const message = state === 'diverged' ? `本地领先 ${ahead} 个版本，同时落后 ${behind} 个版本。`
      : state === 'ahead' ? `有 ${ahead} 个本地版本等待同步。`
        : state === 'behind' ? `GitHub 上有 ${behind} 个较新版本。`
          : dirty ? '有尚未通过后台保存的本地文件变化。' : '本地与 GitHub 已同步。'
    return { available: true, connected: true, branch, ahead, behind, dirty, state, message }
  } catch {
    return { available: false, connected: false, branch: '', ahead: 0, behind: 0, dirty: false, state: 'unavailable', message: '当前目录尚未初始化 Git。' }
  }
}
async function syncToGitHub(commitMessage: string, absolutePaths: string[]): Promise<GitSyncResult> {
  try {
    await runGit(['rev-parse', '--is-inside-work-tree'])
  } catch {
    return { status: 'skipped', message: 'GitHub 尚未初始化，本次只保存在本机。' }
  }
  try {
    await runGit(['remote', 'get-url', 'origin'])
  } catch {
    return { status: 'skipped', message: 'GitHub 仓库尚未连接，本次只保存在本机。' }
  }
  try {
    const paths = [...new Set(absolutePaths.map((file) => path.relative(projectRoot, file).replace(/\\/g, '/')))]
    await runGit(['add', '-A', '--', ...paths])
    let committed = false
    try {
      await runGit(['diff', '--cached', '--quiet'])
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || Number(error.code) !== 1) throw error
      await runGit(['commit', '-m', commitMessage]); committed = true
    }
    const branch = (await runGit(['branch', '--show-current'])).stdout.trim() || 'main'
    await pushWithRetry(branch)
    return { status: 'synced', message: committed ? '已自动同步到 GitHub，公开网站将自动更新。' : '积压版本已同步，GitHub 当前是最新状态。' }
  } catch (error) {
    const detail = gitErrorDetail(error)
    return { status: 'failed', message: `内容已保存在本机，但 GitHub 自动同步失败：${detail}` }
  }
}
async function syncPendingToGitHub(): Promise<GitSyncResult> {
  try {
    await runGit(['rev-parse', '--is-inside-work-tree']); await runGit(['remote', 'get-url', 'origin'])
    const branch = (await runGit(['branch', '--show-current'])).stdout.trim() || 'main'
    await pushWithRetry(branch)
    return { status: 'synced', message: '已同步到 GitHub，公开网站将自动更新。' }
  } catch (error) {
    return { status: 'failed', message: `同步失败：${gitErrorDetail(error)}` }
  }
}
function syncMessage(base: string, sync: GitSyncResult) {
  return `${base}${sync.message}`
}

function isLocalRequest(req: IncomingMessage) {
  const address = req.socket.remoteAddress ?? ''
  const host = (req.headers.host ?? '').split(':')[0].replace(/^\[|\]$/g, '')
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) && ['127.0.0.1', 'localhost', '::1'].includes(host)
}
function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(payload))
}
function readJson(req: IncomingMessage, maxBytes = 45 * 1024 * 1024) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let size = 0; const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => { size += chunk.length; if (size > maxBytes) { reject(new Error('上传内容过大，请减少图片数量或压缩图片。')); req.destroy() } else chunks.push(chunk) })
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { reject(new Error('上传数据格式不正确。')) } }); req.on('error', reject)
  })
}
const cleanText = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)
const yamlString = (value: string) => JSON.stringify(value.replace(/[\r\n]+/g, ' '))
function fileExists(filePath: string) { try { accessSync(filePath, fsConstants.F_OK); return true } catch { return false } }
function getSection(value: unknown) {
  const key = cleanText(value, 20) as SectionKey; const config = sections[key]
  if (!config) throw new Error('请选择正确的内容栏目。'); return { key, config }
}
function getSlug(value: unknown) {
  const slug = cleanText(value, 80); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('网页地址只能使用小写英文、数字和短横线。'); return slug
}
function safeImageName(name: string, index: number) {
  const extension = path.extname(name).toLowerCase(); if (!['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(extension)) throw new Error(`第 ${index + 1} 张图片格式不支持。`)
  const base = path.basename(name, extension).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return `${base || `image-${index + 1}`}${extension}`
}
function parseImage(image: UploadImage, index: number) {
  const name = safeImageName(cleanText(image.name, 120), index); const match = cleanText(image.data, 12 * 1024 * 1024).match(/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/)
  if (!match) throw new Error(`第 ${index + 1} 张图片数据无效。`); const buffer = Buffer.from(match[2], 'base64'); if (buffer.length > 8 * 1024 * 1024) throw new Error(`图片 ${name} 超过 8MB。`)
  return { name, buffer }
}
function parseMarkdown(content: string) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/); if (!match) return { data: {} as Record<string, unknown>, body: content.trim() }
  const data: Record<string, unknown> = {}; for (const line of match[1].split(/\r?\n/)) { const i = line.indexOf(':'); if (i < 0) continue; const raw = line.slice(i + 1).trim(); try { data[line.slice(0, i).trim()] = JSON.parse(raw) } catch { data[line.slice(0, i).trim()] = raw } }
  return { data, body: match[2].trim() }
}
function stripManagedImages(body: string, slug: string) {
  const marker = /\n?<!-- local-content-images:start -->[\s\S]*?<!-- local-content-images:end -->\s*$/; if (marker.test(body)) return body.replace(marker, '').trim()
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return body.replace(new RegExp(`\\n## 附件图片\\s+((?:!\\[[^\\]]*\\]\\(\\/images\\/${escaped}\\/[^)]+\\)\\s*)+)$`), '').trim()
}
function stripTitleHeading(body: string, title: string) {
  const [first, ...rest] = body.split(/\r?\n/)
  return first.trim() === `# ${title}` ? rest.join('\n').trim() : body
}
async function listImages(slug: string) {
  const dir = path.join(docsRoot, 'public', 'images', slug); if (!fileExists(dir)) return []
  const names = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isFile() && ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(path.extname(e.name).toLowerCase())).map((e) => e.name).sort()
  return names.map((name) => ({ name, url: `/images/${slug}/${name}` }))
}
function contentFields(payload: Record<string, unknown>, section: SectionKey) {
  const result = { title: cleanText(payload.title, 120), summary: cleanText(payload.summary, 240), category: cleanText(payload.category, 60) || sections[section].label, date: cleanText(payload.date, 10), body: cleanText(payload.body, 100000), number: cleanText(payload.number, 4), tags: Array.isArray(payload.tags) ? payload.tags.map((tag) => cleanText(tag, 30)).filter(Boolean).slice(0, 8) : [] }
  if (!result.title) throw new Error('请填写内容标题。'); if (!result.summary) throw new Error('请填写一句话摘要。'); if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date)) throw new Error('日期格式应为 YYYY-MM-DD。'); if (!result.body) throw new Error('请填写正文内容。'); return result
}
function makeMarkdown(section: SectionKey, slug: string, fields: ReturnType<typeof contentFields>, imageNames: string[]) {
  const imageBlock = imageNames.length ? ['', '<!-- local-content-images:start -->', '## 附件图片', '', ...imageNames.flatMap((name) => [`![${fields.title} - ${name}](/images/${slug}/${name})`, '']), '<!-- local-content-images:end -->'] : []
  return ['---', `title: ${yamlString(fields.title)}`, `date: ${fields.date}`, `category: ${yamlString(fields.category)}`, `summary: ${yamlString(fields.summary)}`, ...(section === 'work' ? [`number: ${yamlString(fields.number || '00')}`] : []), `tags: [${fields.tags.map(yamlString).join(', ')}]`, '---', '', `# ${fields.title}`, '', fields.body, ...imageBlock, ''].join('\n')
}
async function backupContent(section: SectionKey, slug: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', ''); const dest = path.join(backupRoot, stamp, section, slug); const source = path.join(docsRoot, sections[section].dir, `${slug}.md`); const images = path.join(docsRoot, 'public', 'images', slug)
  await mkdir(dest, { recursive: true }); await cp(source, path.join(dest, `${slug}.md`)); if (fileExists(images)) await cp(images, path.join(dest, 'images'), { recursive: true }); return path.relative(projectRoot, dest).replace(/\\/g, '/')
}
async function listContent(params: URLSearchParams) {
  const filter = cleanText(params.get('section'), 20); const query = cleanText(params.get('q'), 120).toLocaleLowerCase('zh-CN'); const keys = filter && filter !== 'all' ? [getSection(filter).key] : Object.keys(sections) as SectionKey[]; const items: Record<string, string>[] = []
  for (const key of keys) for (const entry of await readdir(path.join(docsRoot, sections[key].dir), { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name === 'index.md') continue; const slug = path.basename(entry.name, '.md'); const parsed = parseMarkdown(await readFile(path.join(docsRoot, sections[key].dir, entry.name), 'utf8')); const title = cleanText(parsed.data.title || slug, 120); const summary = cleanText(parsed.data.summary, 240); const category = cleanText(parsed.data.category || sections[key].label, 60)
    if (query && !`${title} ${summary} ${category} ${slug}`.toLocaleLowerCase('zh-CN').includes(query)) continue; items.push({ section: key, sectionLabel: sections[key].label, slug, title, summary, category, date: cleanText(parsed.data.date, 10) })
  }
  return items.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'))
}
async function getContent(sectionValue: unknown, slugValue: unknown) {
  const { key, config } = getSection(sectionValue); const slug = getSlug(slugValue); const file = path.join(docsRoot, config.dir, `${slug}.md`); if (!fileExists(file)) throw new Error('没有找到这条内容。'); const parsed = parseMarkdown(await readFile(file, 'utf8'))
  const title = cleanText(parsed.data.title || slug, 120)
  return { section: key, slug, title, date: cleanText(parsed.data.date, 10), category: cleanText(parsed.data.category || config.label, 60), summary: cleanText(parsed.data.summary, 240), number: cleanText(parsed.data.number, 4), tags: Array.isArray(parsed.data.tags) ? parsed.data.tags.map((tag) => cleanText(tag, 30)).filter(Boolean) : [], body: stripTitleHeading(stripManagedImages(parsed.body, slug), title), images: await listImages(slug) }
}
async function createContent(payload: Record<string, unknown>) {
  const { key, config } = getSection(payload.section); const slug = getSlug(payload.slug); const fields = contentFields(payload, key); const file = path.join(docsRoot, config.dir, `${slug}.md`); if (fileExists(file)) throw new Error('这个网页地址已经存在，请换一个英文地址。'); const images = (Array.isArray(payload.images) ? payload.images.slice(0, 5) as UploadImage[] : []).map(parseImage); if (new Set(images.map((i) => i.name)).size !== images.length) throw new Error('上传图片中有重名文件，请重命名后再试。'); const imageDir = path.join(docsRoot, 'public', 'images', slug); if (fileExists(imageDir)) throw new Error('这个网页地址已经有图片目录，请换一个英文地址。')
  await mkdir(path.dirname(file), { recursive: true }); if (images.length) await mkdir(imageDir, { recursive: true }); await writeFile(file, makeMarkdown(key, slug, fields, images.map((i) => i.name)), { encoding: 'utf8', flag: 'wx' }); for (const image of images) await writeFile(path.join(imageDir, image.name), image.buffer, { flag: 'wx' }); return { url: `/${config.dir}/${slug}`, imageCount: images.length }
}
async function updateContent(payload: Record<string, unknown>) {
  const target = getSection(payload.section)
  const source = getSection(payload.originalSection || payload.section)
  const slug = getSlug(payload.slug)
  const fields = contentFields(payload, target.key)
  const sourceFile = path.join(docsRoot, source.config.dir, `${slug}.md`)
  const targetFile = path.join(docsRoot, target.config.dir, `${slug}.md`)
  const moving = source.key !== target.key
  if (!fileExists(sourceFile)) throw new Error('没有找到要修改的内容。')
  if (moving && fileExists(targetFile)) throw new Error('目标栏目已经存在相同网页地址，请先修改其中一条内容。')
  const current = await listImages(slug)
  const currentNames = new Set(current.map((image) => image.name))
  const kept = (Array.isArray(payload.existingImages) ? payload.existingImages.map((name) => path.basename(cleanText(name, 120))) : []).filter((name) => currentNames.has(name))
  const added = (Array.isArray(payload.images) ? payload.images.slice(0, Math.max(0, 5 - kept.length)) as UploadImage[] : []).map(parseImage)
  const finalNames = [...kept, ...added.map((image) => image.name)]
  if (new Set(finalNames).size !== finalNames.length) throw new Error('图片名称重复，请重命名后再上传。')
  const backup = await backupContent(source.key, slug)
  const imageDir = path.join(docsRoot, 'public', 'images', slug)
  if (finalNames.length) await mkdir(imageDir, { recursive: true })
  for (const name of currentNames) if (!kept.includes(name)) await rm(path.join(imageDir, name))
  for (const image of added) await writeFile(path.join(imageDir, image.name), image.buffer, { flag: 'wx' })
  if (!finalNames.length && fileExists(imageDir)) await rm(imageDir, { recursive: true })
  await mkdir(path.dirname(targetFile), { recursive: true })
  await writeFile(targetFile, makeMarkdown(target.key, slug, fields, finalNames), moving ? { encoding: 'utf8', flag: 'wx' } : 'utf8')
  if (moving) await rm(sourceFile)
  return { url: `/${target.config.dir}/${slug}`, backup, imageCount: finalNames.length, moved: moving, previousUrl: `/${source.config.dir}/${slug}` }
}
async function deleteContent(payload: Record<string, unknown>) {
  const { key, config } = getSection(payload.section); const slug = getSlug(payload.slug); const file = path.join(docsRoot, config.dir, `${slug}.md`); if (!fileExists(file)) throw new Error('没有找到要删除的内容。'); const current = await getContent(key, slug); if (cleanText(payload.confirmTitle, 120) !== current.title) throw new Error('确认标题不匹配，已取消删除。'); const backup = await backupContent(key, slug); await rm(file); const imageDir = path.join(docsRoot, 'public', 'images', slug); if (fileExists(imageDir)) await rm(imageDir, { recursive: true }); return { backup }
}
async function getHomeConfig() {
  return JSON.parse(await readFile(homeConfigFile, 'utf8')) as Record<string, unknown>
}
function homeText(value: unknown, max: number, label: string) {
  const text = cleanText(value, max); if (!text) throw new Error(`请填写${label}。`); return text
}
async function saveHomeConfig(payload: Record<string, unknown>) {
  const methodSteps = Array.isArray(payload.methodSteps) ? payload.methodSteps.slice(0, 3).map((item) => {
    const row = item as Record<string, unknown>; return { label: homeText(row.label, 80, '工作步骤标题'), description: homeText(row.description, 240, '工作步骤说明') }
  }) : []
  const repositories = Array.isArray(payload.repositories) ? payload.repositories.slice(0, 6).map((item) => {
    const row = item as Record<string, unknown>; const url = homeText(row.url, 300, '仓库链接'); if (!/^https:\/\/github\.com\//i.test(url)) throw new Error('GitHub 仓库链接需要以 https://github.com/ 开头。'); return { name: homeText(row.name, 100, '仓库名称'), url, description: homeText(row.description, 240, '仓库说明') }
  }) : []
  if (methodSteps.length !== 3) throw new Error('请保留三个工作步骤。')
  if (!repositories.length) throw new Error('请至少填写一个 GitHub 仓库。')
  const previous = await getHomeConfig(); const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', ''); const backupDir = path.join(backupRoot, stamp, 'home'); await mkdir(backupDir, { recursive: true }); await cp(homeConfigFile, path.join(backupDir, 'home-config.json'))
  let portraitUrl = cleanText(payload.portraitUrl, 300) || String(previous.portraitUrl ?? '/hero-persona.png')
  if (payload.portraitImage && typeof payload.portraitImage === 'object') {
    const image = parseImage(payload.portraitImage as UploadImage, 0); const imageDir = path.join(docsRoot, 'public', 'images', 'home'); await mkdir(imageDir, { recursive: true }); const imageName = `portrait-${Date.now()}${path.extname(image.name)}`; await writeFile(path.join(imageDir, imageName), image.buffer, { flag: 'wx' }); portraitUrl = `/images/home/${imageName}`
  }
  const portraitTags = Array.isArray(payload.portraitTags) ? payload.portraitTags.slice(0, 3).map((tag) => homeText(tag, 30, '形象标签')) : []
  if (portraitTags.length !== 3) throw new Error('请填写三个形象标签。')
  const config = {
    heroTitleBefore: homeText(payload.heroTitleBefore, 100, '首页标题前半句'), heroHighlight: homeText(payload.heroHighlight, 40, '首页高亮词'), heroTitleAfter: homeText(payload.heroTitleAfter, 80, '首页标题后半句'),
    heroIntro: homeText(payload.heroIntro, 600, '首页介绍'), portraitUrl, portraitAlt: cleanText(payload.portraitAlt, 120) || 'HellyAI 个人形象', portraitTags,
    methodTitle: homeText(payload.methodTitle, 80, '工作逻辑标题'), methodIntro: homeText(payload.methodIntro, 400, '工作逻辑介绍'), methodSteps,
    coreQuote: homeText(payload.coreQuote, 400, '核心观点'), repositories,
    closingTitle: homeText(payload.closingTitle, 120, '结尾标题'), closingText: homeText(payload.closingText, 400, '结尾文案')
  }
  await writeFile(homeConfigFile, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
  return { config, backup: path.relative(projectRoot, backupDir).replace(/\\/g, '/') }
}
function localContentMiddleware({ rebuildAfterSave }: { rebuildAfterSave: boolean }) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url ?? '/', 'http://localhost'); if (!url.pathname.startsWith('/api/local-content')) return next(); if (!isLocalRequest(req)) return sendJson(res, 403, { error: '本机内容管理只允许从当前电脑访问。' })
    try {
      if (url.pathname === '/api/local-content/status' && req.method === 'GET') return sendJson(res, 200, { available: true, mode: rebuildAfterSave ? 'preview' : 'development', git: await getGitStatus() })
      if (url.pathname === '/api/local-content/sync' && req.method === 'POST') {
        const sync = await syncPendingToGitHub(); const git = await getGitStatus()
        return sendJson(res, sync.status === 'failed' ? 502 : 200, { gitSync: sync, git, message: sync.message })
      }
      if (url.pathname === '/api/local-content/items' && req.method === 'GET') return sendJson(res, 200, { items: await listContent(url.searchParams) })
      if (url.pathname === '/api/local-content/item' && req.method === 'GET') return sendJson(res, 200, await getContent(url.searchParams.get('section'), url.searchParams.get('slug')))
      if (url.pathname === '/api/local-content/home' && req.method === 'GET') return sendJson(res, 200, await getHomeConfig())
      if (url.pathname === '/api/local-content/home' && req.method === 'PUT') {
        const result = await saveHomeConfig(await readJson(req)); if (rebuildAfterSave) await build(docsRoot)
        const sync = await syncToGitHub('更新首页设置', [homeConfigFile, path.join(docsRoot, 'public', 'images', 'home')])
        return sendJson(res, 200, { ...result, gitSync: sync, message: syncMessage('首页设置已保存，原配置已经自动备份。', sync) })
      }
      if (url.pathname !== '/api/local-content') return sendJson(res, 404, { error: '没有找到这个操作。' }); const payload = await readJson(req)
      if (req.method === 'POST') {
        const section = getSection(payload.section); const slug = getSlug(payload.slug); const result = await createContent(payload); if (rebuildAfterSave) await build(docsRoot)
        const sync = await syncToGitHub(`新增内容：${cleanText(payload.title, 80)}`, [path.join(docsRoot, section.config.dir, `${slug}.md`), path.join(docsRoot, 'public', 'images', slug)])
        return sendJson(res, 201, { ...result, gitSync: sync, message: syncMessage('内容已保存，工作台会自动更新。', sync) })
      }
      if (req.method === 'PUT') {
        const target = getSection(payload.section); const source = getSection(payload.originalSection || payload.section); const slug = getSlug(payload.slug); const result = await updateContent(payload); if (rebuildAfterSave) await build(docsRoot)
        const sync = await syncToGitHub(`更新内容：${cleanText(payload.title, 80)}`, [path.join(docsRoot, source.config.dir, `${slug}.md`), path.join(docsRoot, target.config.dir, `${slug}.md`), path.join(docsRoot, 'public', 'images', slug)])
        const baseMessage = result.moved ? '内容已移动到新栏目，原内容已经自动备份。' : '修改已保存，原内容已经自动备份。'
        return sendJson(res, 200, { ...result, gitSync: sync, message: syncMessage(baseMessage, sync) })
      }
      if (req.method === 'DELETE') {
        const section = getSection(payload.section); const slug = getSlug(payload.slug); const result = await deleteContent(payload); if (rebuildAfterSave) await build(docsRoot)
        const sync = await syncToGitHub(`删除内容：${cleanText(payload.confirmTitle, 80)}`, [path.join(docsRoot, section.config.dir, `${slug}.md`), path.join(docsRoot, 'public', 'images', slug)])
        return sendJson(res, 200, { ...result, gitSync: sync, message: syncMessage('内容已删除，原文件已经自动备份。', sync) })
      }
      return sendJson(res, 405, { error: '不支持的操作。' })
    } catch (error) { const message = error instanceof Error ? error.message : '操作失败，请稍后重试。'; return sendJson(res, message.includes('已经存在') || message.includes('重复') ? 409 : message.includes('没有找到') ? 404 : 400, { error: message }) }
  }
}
export function localContentPlugin() {
  return { name: 'local-content-manager', configureServer(server: { middlewares: { use: (handler: ReturnType<typeof localContentMiddleware>) => void } }) { server.middlewares.use(localContentMiddleware({ rebuildAfterSave: false })) }, configurePreviewServer(server: { middlewares: { use: (handler: ReturnType<typeof localContentMiddleware>) => void } }) { server.middlewares.use(localContentMiddleware({ rebuildAfterSave: true })) } }
}
