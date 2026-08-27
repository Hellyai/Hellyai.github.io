<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import HomeSettings from './HomeSettings.vue'

type UploadFile = { file: File; preview: string }
type ExistingImage = { name: string; url: string }
type ContentItem = { section: string; sectionLabel: string; slug: string; title: string; summary: string; category: string; date: string }

const today = new Date().toISOString().slice(0, 10)
const sections = [
  { value: 'work', label: '工作作品', hint: '项目、成果与复盘' },
  { value: 'agents', label: 'Agent 指令', hint: '角色设定与提示词' },
  { value: 'skills', label: 'Skill 技能', hint: '可复用工作流程' }
]

const section = ref('work')
const title = ref('')
const slug = ref('')
const date = ref(today)
const category = ref('')
const summary = ref('')
const number = ref('04')
const tagsText = ref('')
const body = ref('## 项目摘要\n\n请在这里介绍内容。\n\n## 工作过程\n\n记录你的思考与行动。\n\n## 最终成果\n\n说明最终交付与反馈。')
const images = ref<UploadFile[]>([])
const existingImages = ref<ExistingImage[]>([])
const apiAvailable = ref<boolean | null>(null)
const saving = ref(false)
const dragging = ref(false)
const status = ref<{ type: 'success' | 'error' | 'info'; message: string; url?: string } | null>(null)
const slugTouched = ref(false)
const view = ref<'create' | 'manage' | 'home'>('create')
const editing = ref(false)
const editingOriginalSection = ref('')
const moveConfirmed = ref(false)
const items = ref<ContentItem[]>([])
const listLoading = ref(false)
const searchText = ref('')
const filterSection = ref('all')
const deleteTarget = ref<ContentItem | null>(null)
const deleteConfirmText = ref('')
const deleting = ref(false)

const tags = computed(() => tagsText.value.split(/[,，]/).map((item) => item.trim()).filter(Boolean).slice(0, 8))
const movingSection = computed(() => editing.value && Boolean(editingOriginalSection.value) && section.value !== editingOriginalSection.value)
const canSave = computed(() => apiAvailable.value && title.value.trim() && slug.value.trim() && summary.value.trim() && body.value.trim() && !saving.value && (!movingSection.value || moveConfirmed.value))
const selectedSection = computed(() => sections.find((item) => item.value === section.value) ?? sections[0])
const originalSectionLabel = computed(() => sections.find((item) => item.value === editingOriginalSection.value)?.label ?? '')

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}

watch(title, (value) => {
  if (!slugTouched.value && !editing.value) slug.value = makeSlug(value)
})
watch(section, () => { if (editing.value) moveConfirmed.value = false })

watch([section, title, slug, date, category, summary, number, tagsText, body], () => {
  if (typeof sessionStorage === 'undefined' || editing.value) return
  sessionStorage.setItem('local-content-draft', JSON.stringify({
    section: section.value, title: title.value, slug: slug.value, date: date.value,
    category: category.value, summary: summary.value, number: number.value,
    tagsText: tagsText.value, body: body.value, slugTouched: slugTouched.value
  }))
})

async function checkApi() {
  try {
    const response = await fetch('/api/local-content/status', { cache: 'no-store' })
    apiAvailable.value = response.ok
    if (response.ok) await loadItems()
  } catch {
    apiAvailable.value = false
  }
}

async function loadItems() {
  if (!apiAvailable.value) return
  listLoading.value = true
  try {
    const params = new URLSearchParams()
    if (filterSection.value !== 'all') params.set('section', filterSection.value)
    if (searchText.value.trim()) params.set('q', searchText.value.trim())
    const response = await fetch(`/api/local-content/items?${params}`, { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || '读取内容列表失败。')
    items.value = result.items
  } catch (error) {
    status.value = { type: 'error', message: error instanceof Error ? error.message : '读取内容列表失败。' }
  } finally {
    listLoading.value = false
  }
}

watch(filterSection, loadItems)

function resetForm() {
  section.value = 'work'; title.value = ''; slug.value = ''; date.value = today; category.value = ''; summary.value = ''; number.value = '04'; tagsText.value = ''
  body.value = '## 项目摘要\n\n请在这里介绍内容。\n\n## 工作过程\n\n记录你的思考与行动。\n\n## 最终成果\n\n说明最终交付与反馈。'
  images.value.forEach((image) => URL.revokeObjectURL(image.preview)); images.value = []; existingImages.value = []; editing.value = false; editingOriginalSection.value = ''; moveConfirmed.value = false; slugTouched.value = false; status.value = null
}

function openCreate() { resetForm(); view.value = 'create'; restoreDraft() }
function openManage() { editing.value = false; view.value = 'manage'; status.value = null; loadItems() }
function openHome() { editing.value = false; view.value = 'home'; status.value = null }

async function editItem(item: ContentItem) {
  status.value = null
  try {
    const response = await fetch(`/api/local-content/item?section=${encodeURIComponent(item.section)}&slug=${encodeURIComponent(item.slug)}`, { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || '读取内容失败。')
    section.value = result.section; title.value = result.title; slug.value = result.slug; date.value = result.date || today; category.value = result.category; summary.value = result.summary; number.value = result.number || '00'; tagsText.value = result.tags.join('，'); body.value = result.body
    images.value = []; existingImages.value = result.images; editingOriginalSection.value = result.section; editing.value = true; moveConfirmed.value = false; slugTouched.value = true; view.value = 'manage'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) { status.value = { type: 'error', message: error instanceof Error ? error.message : '读取内容失败。' } }
}

function removeExistingImage(index: number) { existingImages.value.splice(index, 1) }
function requestDelete(item: ContentItem) { deleteTarget.value = item; deleteConfirmText.value = '' }
function closeDelete() { if (!deleting.value) { deleteTarget.value = null; deleteConfirmText.value = '' } }

async function confirmDelete() {
  if (!deleteTarget.value || deleteConfirmText.value !== deleteTarget.value.title) return
  deleting.value = true
  try {
    const response = await fetch('/api/local-content', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: deleteTarget.value.section, slug: deleteTarget.value.slug, confirmTitle: deleteConfirmText.value }) })
    const result = await response.json(); if (!response.ok) throw new Error(result.error || '删除失败。')
    status.value = { type: 'success', message: result.message }; deleteTarget.value = null; deleteConfirmText.value = ''; await loadItems()
  } catch (error) { status.value = { type: 'error', message: error instanceof Error ? error.message : '删除失败。' } }
  finally { deleting.value = false }
}

function restoreDraft() {
  const saved = sessionStorage.getItem('local-content-draft')
  if (!saved) return
  try {
    const draft = JSON.parse(saved)
    section.value = draft.section ?? section.value
    title.value = draft.title ?? ''
    slug.value = draft.slug ?? ''
    date.value = draft.date ?? today
    category.value = draft.category ?? ''
    summary.value = draft.summary ?? ''
    number.value = draft.number ?? '04'
    tagsText.value = draft.tagsText ?? ''
    body.value = draft.body ?? body.value
    slugTouched.value = Boolean(draft.slugTouched)
  } catch {
    sessionStorage.removeItem('local-content-draft')
  }
}

function addFiles(fileList: FileList | File[]) {
  const available = Math.max(0, 5 - existingImages.value.length - images.value.length)
  const valid = Array.from(fileList).filter((file) => {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      status.value = { type: 'error', message: `${file.name} 不是支持的图片格式。` }
      return false
    }
    if (file.size > 8 * 1024 * 1024) {
      status.value = { type: 'error', message: `${file.name} 超过 8MB，请压缩后重试。` }
      return false
    }
    return true
  }).slice(0, available)

  images.value.push(...valid.map((file) => ({ file, preview: URL.createObjectURL(file) })))
  if (Array.from(fileList).length > available) {
    status.value = { type: 'info', message: '每篇内容最多上传 5 张图片。' }
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) addFiles(input.files)
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  if (event.dataTransfer?.files) addFiles(event.dataTransfer.files)
}

function removeImage(index: number) {
  const [removed] = images.value.splice(index, 1)
  if (removed) URL.revokeObjectURL(removed.preview)
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`无法读取图片 ${file.name}`))
    reader.readAsDataURL(file)
  })
}

async function saveContent() {
  status.value = null
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.value)) {
    status.value = { type: 'error', message: '网页地址只能使用小写英文、数字和短横线，例如 ai-workflow。' }
    return
  }

  saving.value = true
  try {
    const uploadedImages = await Promise.all(images.value.map(async ({ file }) => ({
      name: file.name,
      type: file.type,
      data: await fileToDataUrl(file)
    })))
    const response = await fetch('/api/local-content', {
      method: editing.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section: section.value,
        originalSection: editingOriginalSection.value || section.value,
        title: title.value,
        slug: slug.value,
        date: date.value,
        category: category.value || selectedSection.value.label,
        summary: summary.value,
        number: number.value,
        tags: tags.value,
        body: body.value,
        existingImages: existingImages.value.map((image) => image.name),
        images: uploadedImages
      })
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || '保存失败，请稍后重试。')
    status.value = { type: 'success', message: result.message, url: result.url }
    if (!editing.value) sessionStorage.removeItem('local-content-draft')
    if (editing.value) { editingOriginalSection.value = section.value; moveConfirmed.value = false }
    await loadItems()
  } catch (error) {
    status.value = { type: 'error', message: error instanceof Error ? error.message : '保存失败，请稍后重试。' }
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  restoreDraft()
  await checkApi()
  const params = new URLSearchParams(window.location.search)
  const requestedSection = params.get('section')
  if (requestedSection && sections.some((item) => item.value === requestedSection)) section.value = requestedSection
  const editTarget = params.get('edit')
  if (editTarget?.includes('/')) {
    const [editSection, editSlug] = editTarget.split('/', 2)
    await editItem({ section: editSection, slug: editSlug } as ContentItem)
  } else if (params.get('view') === 'home') {
    openHome()
  } else if (params.get('view') === 'manage') {
    openManage()
  }
})
</script>

<template>
  <div class="content-manager">
    <header class="manager-header">
      <div>
        <h1>把新内容收进工作台</h1>
        <p>填写一次，系统会在本机生成文章、保存图片，并更新网站。</p>
      </div>
      <div class="local-badge" :class="{ offline: apiAvailable === false }">
        <span class="local-dot" aria-hidden="true"></span>
        {{ apiAvailable === null ? '正在检查本机服务' : apiAvailable ? '本机保存已连接' : '本机保存未连接' }}
      </div>
    </header>

    <div v-if="apiAvailable === false" class="service-notice" role="alert">
      <strong>当前页面只能阅读，暂时不能保存。</strong>
      <span>请在项目目录运行 <code>npm.cmd run docs:dev</code>，然后重新打开本页。</span>
    </div>

    <nav class="manager-tabs" aria-label="内容管理方式">
      <button type="button" :class="{ active: view === 'create' }" @click="openCreate">新增内容</button>
      <button type="button" :class="{ active: view === 'manage' }" @click="openManage">管理已有内容 <span>{{ items.length }}</span></button>
      <button type="button" :class="{ active: view === 'home' }" @click="openHome">首页设置</button>
    </nav>

    <HomeSettings v-if="view === 'home'" />

    <section v-else-if="view === 'manage' && !editing" class="content-library">
      <div class="library-toolbar">
        <div>
          <h2>管理已有内容</h2>
          <p>搜索、筛选并选择需要修改的内容。</p>
        </div>
        <form class="library-search" @submit.prevent="loadItems">
          <label><span class="sr-only">搜索内容</span><input v-model="searchText" placeholder="搜索标题、摘要或英文地址"></label>
          <label><span class="sr-only">筛选栏目</span><select v-model="filterSection"><option value="all">全部栏目</option><option v-for="item in sections" :key="item.value" :value="item.value">{{ item.label }}</option></select></label>
          <button type="submit">搜索</button>
        </form>
      </div>
      <div v-if="status" class="save-status" :class="status.type" role="status"><span>{{ status.message }}</span></div>
      <div v-if="listLoading" class="library-empty">正在读取内容…</div>
      <div v-else-if="!items.length" class="library-empty"><strong>没有找到符合条件的内容</strong><span>可以调整搜索词或栏目筛选。</span></div>
      <ul v-else class="content-list">
        <li v-for="item in items" :key="`${item.section}/${item.slug}`">
          <div class="content-meta"><span>{{ item.sectionLabel }}</span><time>{{ item.date || '未填写日期' }}</time></div>
          <div class="content-copy"><h3>{{ item.title }}</h3><p>{{ item.summary || `/${item.section}/${item.slug}` }}</p><small>/{{ item.section }}/{{ item.slug }}</small></div>
          <div class="content-actions"><button type="button" class="edit-button" @click="editItem(item)">编辑</button><button type="button" class="delete-button" @click="requestDelete(item)">删除</button></div>
        </li>
      </ul>
    </section>

    <main v-else class="manager-layout">
      <form class="editor-panel" @submit.prevent="saveContent">
        <div v-if="editing" class="editing-banner"><div><strong>正在编辑：{{ title }}</strong><span>网页地址保持不变；保存前会自动备份原内容和图片。</span></div><button type="button" @click="openManage">退出编辑</button></div>
        <fieldset class="section-picker">
          <legend>{{ editing ? '当前栏目 / 移动到其他栏目' : '选择内容栏目' }}</legend>
          <label v-for="item in sections" :key="item.value" class="section-option" :class="{ active: section === item.value }">
            <input v-model="section" type="radio" name="section" :value="item.value">
            <span><strong>{{ item.label }}</strong><small>{{ item.hint }}</small></span>
          </label>
        </fieldset>
        <div v-if="movingSection" class="move-notice">
          <div><strong>内容将从“{{ originalSectionLabel }}”移动到“{{ selectedSection.label }}”</strong><span>原网址 /{{ editingOriginalSection }}/{{ slug }} 将失效，新网址是 /{{ section }}/{{ slug }}。系统会先自动备份。</span></div>
          <button type="button" :class="{ confirmed: moveConfirmed }" @click="moveConfirmed = !moveConfirmed">{{ moveConfirmed ? '已确认移动' : '确认网址变化' }}</button>
        </div>

        <section class="form-section">
          <div class="section-heading">
            <h2>基本信息</h2>
            <span>必填项已标记</span>
          </div>
          <div class="field-grid">
            <label class="field field-wide">
              <span>标题 <em>必填</em></span>
              <input v-model="title" required maxlength="120" placeholder="例如：AI 合同审查工作流">
            </label>
            <label class="field field-wide">
              <span>网页英文地址 <em>必填</em></span>
              <div class="slug-input" :class="{ locked: editing }"><span>/{{ selectedSection.value }}/</span><input v-model="slug" required :disabled="editing" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="ai-contract-review" @input="slugTouched = true"></div>
              <small>{{ editing ? '编辑时锁定网页地址，避免原链接失效。' : '使用小写英文、数字和短横线，保存后不建议修改。' }}</small>
            </label>
            <label class="field">
              <span>日期 <em>必填</em></span>
              <input v-model="date" required type="date">
            </label>
            <label class="field">
              <span>分类</span>
              <input v-model="category" maxlength="60" :placeholder="selectedSection.label">
            </label>
            <label v-if="section === 'work'" class="field">
              <span>作品编号</span>
              <input v-model="number" maxlength="4" placeholder="04">
            </label>
            <label class="field" :class="{ 'field-wide': section !== 'work' }">
              <span>标签</span>
              <input v-model="tagsText" maxlength="160" placeholder="AI，研究，工作流">
            </label>
            <label class="field field-wide">
              <span>一句话摘要 <em>必填</em></span>
              <textarea v-model="summary" required maxlength="240" rows="3" placeholder="说明这篇内容解决了什么问题，以及最终交付了什么。"></textarea>
              <small>{{ summary.length }}/240</small>
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <h2>正文内容</h2>
            <span>支持 Markdown 标题、列表和链接</span>
          </div>
          <label class="field">
            <span class="sr-only">正文内容</span>
            <textarea v-model="body" required class="body-editor" rows="18"></textarea>
          </label>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <h2>添加图片</h2>
            <span>最多 5 张，每张不超过 8MB</span>
          </div>
          <label class="drop-zone" :class="{ dragging }" @dragenter.prevent="dragging = true" @dragover.prevent @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple @change="onFileChange">
            <strong>把图片拖到这里</strong>
            <span>或者点击选择 PNG、JPG、WebP、GIF</span>
          </label>
          <ul v-if="existingImages.length" class="image-list existing-image-list">
            <li v-for="(image, index) in existingImages" :key="image.url">
              <img :src="image.url" :alt="image.name">
              <span><strong>{{ image.name }}</strong><small>已保存图片</small></span>
              <button type="button" @click="removeExistingImage(index)">从文章移除</button>
            </li>
          </ul>
          <ul v-if="images.length" class="image-list">
            <li v-for="(image, index) in images" :key="image.preview">
              <img :src="image.preview" :alt="image.file.name">
              <span><strong>{{ image.file.name }}</strong><small>{{ (image.file.size / 1024 / 1024).toFixed(2) }} MB</small></span>
              <button type="button" @click="removeImage(index)">移除</button>
            </li>
          </ul>
        </section>

        <div v-if="status" class="save-status" :class="status.type" role="status">
          <span>{{ status.message }}</span>
          <a v-if="status.url" :href="status.url">打开新内容 →</a>
        </div>

        <div class="save-bar">
          <div><strong>内容只会保存到这台电脑</strong><span>遇到同名文件会停止保存，不会覆盖原内容。</span></div>
          <button type="submit" :disabled="!canSave">{{ saving ? '正在保存…' : editing ? '保存修改' : '保存并加入工作台' }}</button>
        </div>
      </form>

      <aside class="preview-panel">
        <div class="preview-sticky">
          <div class="preview-heading"><h2>发布预览</h2><span>{{ selectedSection.label }}</span></div>
          <article class="paper-preview">
            <p class="preview-category">{{ category || selectedSection.label }} · {{ date }}</p>
            <h3>{{ title || '内容标题会显示在这里' }}</h3>
            <p class="preview-summary">{{ summary || '填写一句话摘要，让读者快速理解这篇内容的价值。' }}</p>
            <div class="preview-tags"><span v-for="tag in tags" :key="tag">{{ tag }}</span></div>
            <div class="preview-body">{{ body || '正文内容会显示在这里。' }}</div>
          </article>
          <p class="preview-note">保存后，系统会生成 Markdown 文件；图片会自动追加到正文末尾。</p>
        </div>
      </aside>
    </main>

    <div v-if="deleteTarget" class="confirm-overlay" role="presentation" @click.self="closeDelete">
      <section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <span class="danger-label">危险操作</span>
        <h2 id="delete-title">确认删除这条内容？</h2>
        <p>删除前系统会自动备份文章和图片。请输入完整标题确认：</p>
        <strong>{{ deleteTarget.title }}</strong>
        <label><span class="sr-only">输入标题确认删除</span><input v-model="deleteConfirmText" :placeholder="deleteTarget.title" @keyup.enter="confirmDelete"></label>
        <div class="confirm-actions"><button type="button" class="cancel-button" @click="closeDelete">取消</button><button type="button" class="confirm-delete-button" :disabled="deleteConfirmText !== deleteTarget.title || deleting" @click="confirmDelete">{{ deleting ? '正在删除…' : '确认删除' }}</button></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.content-manager { --manager-green: #315f56; --manager-ink: #283531; --manager-muted: #65716c; --manager-paper: #fbf6ee; --manager-cream: #f2e8db; --manager-blue: #dbe7ed; --manager-orange: #e8783d; min-height: calc(100vh - 64px); color: var(--manager-ink); background: var(--manager-paper); }
.manager-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; max-width: 1320px; margin: 0 auto; padding: clamp(48px, 7vw, 86px) clamp(24px, 4vw, 52px) 34px; }
.manager-header h1 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1.2; letter-spacing: -.035em; }
.manager-header p { margin: 14px 0 0; color: var(--manager-muted); line-height: 1.8; }
.local-badge { display: inline-flex; align-items: center; gap: 10px; flex: none; padding: 10px 14px; border-radius: 999px; background: #e7eee9; color: var(--manager-green); font-size: .8rem; font-weight: 700; }
.local-badge.offline { background: #f6e4da; color: #9a3f2d; }
.local-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 5px color-mix(in srgb, currentColor 14%, transparent); }
.service-notice { max-width: 1216px; margin: 0 auto 24px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 20px; border-radius: 14px; background: #f7ddd0; color: #6e3024; }
.service-notice span { font-size: .86rem; }
.service-notice code { padding: 3px 7px; border-radius: 6px; background: rgba(255,255,255,.5); }
.manager-tabs { display: flex; gap: 4px; max-width: 1216px; margin: 0 auto 28px; border-bottom: 2px solid rgba(49,95,86,.1); }
.manager-tabs button { margin-bottom: -2px; border: 0; border-bottom: 2px solid transparent; padding: 12px 18px; background: transparent; color: var(--manager-muted); cursor: pointer; font: inherit; font-size: .88rem; font-weight: 700; }
.manager-tabs button:hover { background: #eee6da; }
.manager-tabs button.active { border-bottom-color: var(--manager-green); color: var(--manager-green); }
.manager-tabs button span { margin-left: 6px; padding: 2px 7px; border-radius: 999px; background: #e4ece8; font-size: .68rem; }
.content-library { max-width: 1216px; margin: 0 auto; padding: 0 0 clamp(80px, 10vw, 130px); }
.library-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; margin-bottom: 24px; }
.library-toolbar h2 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: clamp(1.35rem, 2.4vw, 1.8rem); }
.library-toolbar p { margin: 8px 0 0; color: var(--manager-muted); font-size: .84rem; }
.library-search { display: grid; grid-template-columns: minmax(240px, 1fr) 150px auto; gap: 8px; min-width: min(100%, 540px); }
.library-search input, .library-search select { width: 100%; min-height: 42px; border: 1.5px solid rgba(49,95,86,.16); border-radius: 9px; padding: 9px 12px; background: #fffdf8; color: var(--manager-ink); font: inherit; font-size: .82rem; }
.library-search input:focus, .library-search select:focus { outline: 0; border-color: var(--manager-green); box-shadow: 0 0 0 3px rgba(49,95,86,.11); }
.library-search button { border: 0; border-radius: 9px; padding: 9px 16px; background: var(--manager-green); color: #f9f1e5; cursor: pointer; font-weight: 700; }
.content-list { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
.content-list li { display: grid; grid-template-columns: 150px minmax(0, 1fr) auto; align-items: center; gap: 22px; padding: 20px 22px; border: 1px solid rgba(49,95,86,.09); border-radius: 14px; background: rgba(255,255,255,.58); transition: transform .18s ease, box-shadow .18s ease; }
.content-list li:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(49,95,86,.07); }
.content-meta { display: flex; flex-direction: column; gap: 6px; }
.content-meta span { color: var(--manager-green); font-size: .72rem; font-weight: 800; }
.content-meta time { color: var(--manager-muted); font-size: .72rem; }
.content-copy { min-width: 0; }
.content-copy h3 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: 1.05rem; }
.content-copy p { overflow: hidden; margin: 7px 0 4px; color: var(--manager-muted); font-size: .8rem; text-overflow: ellipsis; white-space: nowrap; }
.content-copy small { color: #89928e; font-size: .68rem; }
.content-actions { display: flex; gap: 7px; }
.content-actions button { border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-weight: 700; }
.edit-button { background: #e4ece8; color: var(--manager-green); }
.edit-button:hover { background: #d4e3dc; }
.delete-button { background: transparent; color: #9a3f2d; }
.delete-button:hover { background: #f7ddd0; }
.library-empty { display: flex; min-height: 220px; flex-direction: column; align-items: center; justify-content: center; gap: 8px; border: 2px dashed rgba(49,95,86,.16); border-radius: 16px; color: var(--manager-muted); }
.library-empty strong { color: var(--manager-ink); font-family: 'Noto Serif SC', serif; }
.library-empty span { font-size: .8rem; }
.manager-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, .43fr); gap: clamp(28px, 4vw, 58px); max-width: 1320px; margin: 0 auto; padding: 0 clamp(24px, 4vw, 52px) clamp(80px, 10vw, 130px); }
.editor-panel { min-width: 0; }
.editing-banner { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 22px; padding: 16px 18px; border-radius: 14px; background: #e4ece8; color: var(--manager-green); }
.editing-banner div { display: flex; min-width: 0; flex-direction: column; gap: 4px; }
.editing-banner strong { overflow: hidden; font-family: 'Noto Serif SC', serif; text-overflow: ellipsis; white-space: nowrap; }
.editing-banner span { font-size: .74rem; opacity: .78; }
.editing-banner button { flex: none; border: 1px solid rgba(49,95,86,.2); border-radius: 8px; padding: 8px 11px; background: transparent; color: inherit; cursor: pointer; font-weight: 700; }
.section-picker { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 0 0 26px; padding: 0; border: 0; }
.section-picker legend { width: 100%; margin-bottom: 12px; font-size: .78rem; font-weight: 700; color: var(--manager-muted); }
.section-option { min-width: 0; cursor: pointer; }
.section-option input { position: absolute; opacity: 0; pointer-events: none; }
.section-option > span { min-height: 82px; display: flex; flex-direction: column; justify-content: center; padding: 14px; border: 1px solid rgba(49,95,86,.13); border-radius: 12px; background: rgba(255,255,255,.45); transition: border-color .18s ease, background .18s ease, transform .18s ease; }
.section-option:hover > span { transform: translateY(-2px); border-color: rgba(49,95,86,.38); }
.section-option.active > span { border-color: var(--manager-green); background: var(--manager-green); color: #f9f1e5; }
.section-option input:focus-visible + span { outline: 3px solid rgba(232,173,66,.55); outline-offset: 3px; }
.section-option strong { font-size: .88rem; }
.section-option small { margin-top: 5px; font-size: .7rem; line-height: 1.35; opacity: .7; }
.move-notice { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: -8px 0 24px; padding: 16px 18px; border-radius: 14px; background: #f7e4ad; color: #6f5318; }
.move-notice div { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.move-notice strong { font-family: 'Noto Serif SC', serif; font-size: .9rem; }
.move-notice span { font-size: .72rem; line-height: 1.6; }
.move-notice button { flex: none; border: 1px solid rgba(111,83,24,.26); border-radius: 9px; padding: 9px 12px; background: #fffaf2; color: inherit; cursor: pointer; font-weight: 800; }
.move-notice button.confirmed { border-color: #315f56; background: #315f56; color: #f9f1e5; }
.form-section { margin-bottom: 20px; padding: clamp(24px, 3vw, 36px); border-radius: 16px; background: rgba(255,255,255,.62); box-shadow: 0 12px 34px rgba(49,95,86,.055); }
.section-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.section-heading h2 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: 1.22rem; }
.section-heading span { font-size: .75rem; color: var(--manager-muted); }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.field-wide { grid-column: 1 / -1; }
.field > span { font-size: .82rem; font-weight: 700; }
.field em { margin-left: 5px; color: var(--manager-orange); font-size: .68rem; font-style: normal; }
.field input, .field textarea { width: 100%; border: 1.5px solid rgba(49,95,86,.16); border-radius: 10px; padding: 11px 13px; background: #fffdf8; color: var(--manager-ink); font: inherit; font-size: .9rem; line-height: 1.6; transition: border-color .18s ease, box-shadow .18s ease; }
.field input:focus, .field textarea:focus { outline: 0; border-color: var(--manager-green); box-shadow: 0 0 0 3px rgba(49,95,86,.11); }
.field input::placeholder, .field textarea::placeholder { color: #858f8a; }
.field > small { align-self: flex-end; color: var(--manager-muted); font-size: .72rem; }
.slug-input { display: flex; align-items: center; overflow: hidden; border: 1.5px solid rgba(49,95,86,.16); border-radius: 10px; background: #eee6da; }
.slug-input:focus-within { border-color: var(--manager-green); box-shadow: 0 0 0 3px rgba(49,95,86,.11); }
.slug-input span { padding-left: 13px; color: var(--manager-muted); font-size: .84rem; white-space: nowrap; }
.slug-input input { border: 0; border-radius: 0; box-shadow: none !important; }
.slug-input.locked { opacity: .68; }
.slug-input.locked input { cursor: not-allowed; }
.body-editor { min-height: 380px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace !important; }
.drop-zone { min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; border: 2px dashed rgba(49,95,86,.28); border-radius: 14px; background: #f5ede2; cursor: pointer; transition: border-color .18s ease, background .18s ease; }
.drop-zone:hover, .drop-zone.dragging { border-color: var(--manager-green); background: #e7eee9; }
.drop-zone input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.drop-zone strong { font-size: .95rem; }
.drop-zone span { color: var(--manager-muted); font-size: .78rem; }
.drop-zone:focus-within { outline: 3px solid rgba(232,173,66,.55); outline-offset: 3px; }
.image-list { display: flex; flex-direction: column; gap: 10px; margin: 16px 0 0; padding: 0; list-style: none; }
.image-list li { display: grid; grid-template-columns: 58px 1fr auto; align-items: center; gap: 14px; padding: 10px; border-radius: 12px; background: #f2eadf; }
.image-list img { width: 58px; height: 48px; border-radius: 8px; object-fit: cover; }
.image-list span { min-width: 0; display: flex; flex-direction: column; }
.image-list strong { overflow: hidden; font-size: .8rem; text-overflow: ellipsis; white-space: nowrap; }
.image-list small { color: var(--manager-muted); font-size: .7rem; }
.image-list button { border: 0; padding: 8px 10px; border-radius: 8px; background: transparent; color: #9a3f2d; cursor: pointer; font-weight: 700; }
.image-list button:hover { background: #f7ddd0; }
.save-status { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 18px 0; padding: 16px 18px; border-radius: 12px; font-size: .86rem; }
.save-status.success { background: #e2ede5; color: #214e43; }
.save-status.error { background: #f7ddd0; color: #7c3527; }
.save-status.info { background: var(--manager-blue); color: #355265; }
.save-status a { color: inherit; font-weight: 700; }
.save-bar { position: sticky; bottom: 18px; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 18px 20px; border-radius: 16px; background: var(--manager-green); color: #f9f1e5; box-shadow: 0 16px 38px rgba(40,53,49,.2); }
.save-bar div { display: flex; flex-direction: column; }
.save-bar strong { font-size: .86rem; }
.save-bar span { margin-top: 3px; font-size: .7rem; opacity: .72; }
.save-bar button { flex: none; border: 0; border-radius: 10px; padding: 12px 18px; background: #e8ad42; color: #283531; cursor: pointer; font-weight: 800; transition: transform .18s ease, opacity .18s ease; }
.save-bar button:hover:not(:disabled) { transform: translateY(-2px); }
.save-bar button:focus-visible { outline: 3px solid #fbf6ee; outline-offset: 3px; }
.save-bar button:disabled { cursor: not-allowed; opacity: .48; }
.preview-panel { min-width: 0; }
.preview-sticky { position: sticky; top: 92px; }
.preview-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.preview-heading h2 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: 1.1rem; }
.preview-heading span { padding: 5px 9px; border-radius: 999px; background: var(--manager-blue); color: #355265; font-size: .7rem; font-weight: 700; }
.paper-preview { min-height: 500px; padding: clamp(26px, 3vw, 40px); border-radius: 16px; background: #f8efe2; box-shadow: 0 18px 46px rgba(49,95,86,.09); }
.preview-category { margin: 0 0 16px; color: var(--manager-orange); font-size: .7rem; font-weight: 700; letter-spacing: .08em; }
.paper-preview h3 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: clamp(1.55rem, 2.6vw, 2.15rem); line-height: 1.35; }
.preview-summary { margin: 18px 0; color: var(--manager-muted); font-size: .88rem; line-height: 1.8; }
.preview-tags { display: flex; flex-wrap: wrap; gap: 6px; min-height: 28px; }
.preview-tags span { padding: 4px 8px; border-radius: 999px; background: #e4ece8; color: var(--manager-green); font-size: .68rem; }
.preview-body { margin-top: 28px; padding-top: 24px; border-top: 1px solid rgba(49,95,86,.13); color: #48534f; font-size: .78rem; line-height: 1.8; white-space: pre-wrap; }
.preview-note { margin: 14px 4px 0; color: var(--manager-muted); font-size: .72rem; line-height: 1.7; }
.confirm-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(40,53,49,.58); }
.confirm-dialog { width: min(100%, 500px); max-height: 86vh; overflow-y: auto; border-radius: 18px; padding: clamp(26px, 4vw, 38px); background: var(--manager-paper); box-shadow: 0 24px 70px rgba(40,53,49,.28); }
.danger-label { display: inline-block; margin-bottom: 12px; padding: 5px 9px; border-radius: 999px; background: #f7ddd0; color: #9a3f2d; font-size: .7rem; font-weight: 800; }
.confirm-dialog h2 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: 1.35rem; }
.confirm-dialog p { margin: 14px 0 8px; color: var(--manager-muted); font-size: .84rem; line-height: 1.7; }
.confirm-dialog > strong { display: block; margin-bottom: 14px; color: #7c3527; }
.confirm-dialog input { width: 100%; border: 1.5px solid rgba(154,63,45,.25); border-radius: 10px; padding: 11px 13px; background: #fffdf8; color: var(--manager-ink); font: inherit; }
.confirm-dialog input:focus { outline: 0; border-color: #9a3f2d; box-shadow: 0 0 0 3px rgba(154,63,45,.1); }
.confirm-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 22px; }
.confirm-actions button { border: 0; border-radius: 9px; padding: 10px 15px; cursor: pointer; font-weight: 800; }
.cancel-button { background: #e8e1d7; color: var(--manager-ink); }
.confirm-delete-button { background: #9a3f2d; color: #fbf6ee; }
.confirm-delete-button:disabled { cursor: not-allowed; opacity: .42; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 1040px) { .manager-layout { grid-template-columns: 1fr; } .preview-panel { order: -1; } .preview-sticky { position: static; } .paper-preview { min-height: 0; } }
@media (max-width: 900px) { .manager-tabs, .content-library { margin-inline: 16px; } .library-toolbar { align-items: stretch; flex-direction: column; } .library-search { min-width: 0; } .content-list li { grid-template-columns: 1fr auto; } .content-meta { grid-column: 1 / -1; flex-direction: row; justify-content: space-between; } }
@media (max-width: 760px) { .manager-header { align-items: flex-start; flex-direction: column; } .manager-layout { padding-inline: 16px; } .section-picker { grid-template-columns: 1fr 1fr; } .section-option:last-child { grid-column: 1 / -1; } .field-grid { grid-template-columns: 1fr; } .field-wide { grid-column: auto; } .service-notice { margin-inline: 16px; align-items: flex-start; flex-direction: column; } .save-bar, .editing-banner, .move-notice { align-items: stretch; flex-direction: column; } .save-bar button { width: 100%; } .library-search { grid-template-columns: 1fr; } .content-list li { grid-template-columns: 1fr; } .content-meta, .content-actions { grid-column: auto; } .content-actions button { flex: 1; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
</style>
