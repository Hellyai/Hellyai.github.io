<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Step = { label: string; description: string }
type Repo = { name: string; url: string; description: string }
type HomeConfig = {
  heroTitleBefore: string; heroHighlight: string; heroTitleAfter: string; heroIntro: string
  portraitUrl: string; portraitAlt: string; portraitTags: string[]
  methodTitle: string; methodIntro: string; methodSteps: Step[]; coreQuote: string
  repositories: Repo[]; closingTitle: string; closingText: string
  aboutTitle: string; aboutLead: string; aboutText: string
}

const config = ref<HomeConfig | null>(null)
const loading = ref(true)
const saving = ref(false)
const status = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const portraitFile = ref<File | null>(null)
const portraitPreview = ref('')

async function loadConfig() {
  loading.value = true
  try { const response = await fetch('/api/local-content/home', { cache: 'no-store' }); const result = await response.json(); if (!response.ok) throw new Error(result.error); config.value = result }
  catch (error) { status.value = { type: 'error', message: error instanceof Error ? error.message : '读取首页设置失败。' } }
  finally { loading.value = false }
}
function selectPortrait(event: Event) {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 8 * 1024 * 1024) { status.value = { type: 'error', message: '请选择不超过 8MB 的 PNG、JPG、WebP 或 GIF 图片。' }; return }
  if (portraitPreview.value) URL.revokeObjectURL(portraitPreview.value); portraitFile.value = file; portraitPreview.value = URL.createObjectURL(file)
}
function fileToDataUrl(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) }) }
function addRepository() { config.value?.repositories.push({ name: '', url: 'https://github.com/Hellyai/', description: '' }) }
function removeRepository(index: number) { if (config.value && config.value.repositories.length > 1) config.value.repositories.splice(index, 1) }
async function save() {
  if (!config.value) return; saving.value = true; status.value = null
  try {
    const portraitImage = portraitFile.value ? { name: portraitFile.value.name, type: portraitFile.value.type, data: await fileToDataUrl(portraitFile.value) } : undefined
    const response = await fetch('/api/local-content/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config.value, portraitImage }) })
    const result = await response.json(); if (!response.ok) throw new Error(result.error || '保存失败。'); config.value = result.config; portraitFile.value = null; if (portraitPreview.value) URL.revokeObjectURL(portraitPreview.value); portraitPreview.value = ''; status.value = { type: 'success', message: result.message }
  } catch (error) { status.value = { type: 'error', message: error instanceof Error ? error.message : '保存失败。' } }
  finally { saving.value = false }
}
onMounted(loadConfig)
</script>

<template>
  <section class="home-settings">
    <header><div><h2>首页设置</h2><p>修改固定展示内容；保存前会自动备份原配置。</p></div><a href="/" target="_blank">打开首页 ↗</a></header>
    <div v-if="loading" class="settings-loading">正在读取首页设置…</div>
    <form v-else-if="config" @submit.prevent="save">
      <section class="settings-card"><div class="card-title"><span>01</span><div><h3>首页标题与介绍</h3><p>高亮词会保留手绘黄色标记。</p></div></div><div class="settings-grid"><label><span>标题前半句</span><input v-model="config.heroTitleBefore" required></label><label><span>高亮词</span><input v-model="config.heroHighlight" required></label><label><span>标题后半句</span><input v-model="config.heroTitleAfter" required></label><label class="wide"><span>首页介绍</span><textarea v-model="config.heroIntro" rows="4" required></textarea></label></div></section>
      <section class="settings-card"><div class="card-title"><span>02</span><div><h3>个人形象</h3><p>上传新图后自动更新首页，建议使用横向或方形图片。</p></div></div><div class="portrait-editor"><img :src="portraitPreview || config.portraitUrl" :alt="config.portraitAlt"><div><label class="upload-button"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="selectPortrait">选择新图片</label><label><span>图片说明</span><input v-model="config.portraitAlt"></label></div></div><div class="tag-grid"><label v-for="(_, index) in config.portraitTags" :key="index"><span>形象标签 {{ index + 1 }}</span><input v-model="config.portraitTags[index]" required></label></div></section>
      <section class="settings-card"><div class="card-title"><span>03</span><div><h3>我的工作逻辑</h3><p>保留三个步骤，形成清晰的工作方法。</p></div></div><div class="settings-grid"><label><span>区域标题</span><input v-model="config.methodTitle" required></label><label class="wide"><span>区域介绍</span><textarea v-model="config.methodIntro" rows="3" required></textarea></label></div><div class="step-editors"><div v-for="(step, index) in config.methodSteps" :key="index"><strong>步骤 {{ index + 1 }}</strong><label><span>步骤标题</span><input v-model="step.label" required></label><label><span>步骤说明</span><textarea v-model="step.description" rows="3" required></textarea></label></div></div><label class="block-field"><span>核心观点文字</span><textarea v-model="config.coreQuote" rows="4" required></textarea></label></section>
      <section class="settings-card"><div class="card-title"><span>04</span><div><h3>GitHub 仓库</h3><p>可增减仓库，每项包含名称、链接和一句说明。</p></div></div><div class="repo-editors"><div v-for="(repo, index) in config.repositories" :key="index"><div class="repo-editor-head"><strong>仓库 {{ index + 1 }}</strong><button type="button" :disabled="config.repositories.length === 1" @click="removeRepository(index)">移除</button></div><label><span>仓库名称</span><input v-model="repo.name" required></label><label><span>GitHub 链接</span><input v-model="repo.url" type="url" required></label><label><span>一句说明</span><input v-model="repo.description" required></label></div></div><button type="button" class="add-repo" @click="addRepository">＋ 添加仓库</button></section>
      <section class="settings-card"><div class="card-title"><span>05</span><div><h3>页面结尾</h3><p>最后一屏的主张与说明。</p></div></div><div class="settings-grid"><label class="wide"><span>结尾标题</span><input v-model="config.closingTitle" required></label><label class="wide"><span>结尾文案</span><textarea v-model="config.closingText" rows="4" required></textarea></label></div></section>
      <section class="settings-card"><div class="card-title"><span>06</span><div><h3>我是谁</h3><p>首页末尾的个人介绍，形象图和关键词会沿用上方设置。</p></div></div><div class="settings-grid"><label class="wide"><span>区域标题</span><input v-model="config.aboutTitle" required></label><label class="wide"><span>一句话介绍</span><textarea v-model="config.aboutLead" rows="2" required></textarea></label><label class="wide"><span>详细介绍</span><textarea v-model="config.aboutText" rows="5" required></textarea></label></div></section>
      <div v-if="status" class="settings-status" :class="status.type">{{ status.message }}</div>
      <div class="settings-save"><div><strong>保存后自动更新首页</strong><span>原配置保存在 .content-backups 文件夹。</span></div><button type="submit" :disabled="saving">{{ saving ? '正在保存…' : '保存首页设置' }}</button></div>
    </form>
  </section>
</template>

<style scoped>
.home-settings { max-width: 1216px; margin: 0 auto; padding: 0 0 clamp(80px,10vw,130px); color: #283531; }
.home-settings > header { display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px }.home-settings h2{margin:0;font-family:'Noto Serif SC',serif;font-size:clamp(1.35rem,2.4vw,1.8rem)}.home-settings header p{margin:8px 0 0;color:#65716c;font-size:.84rem}.home-settings header a{color:#315f56;font-size:.8rem;font-weight:700}.settings-loading{display:grid;place-items:center;min-height:240px;color:#65716c}
.settings-card{margin-bottom:18px;padding:clamp(24px,3vw,36px);border-radius:16px;background:rgba(255,255,255,.62);box-shadow:0 10px 30px rgba(49,95,86,.05)}.card-title{display:flex;gap:16px;margin-bottom:24px}.card-title>span{color:#507b93;font-family:'Fraunces',serif;font-size:1.5rem;font-style:italic;opacity:.45}.card-title h3{margin:0;font-family:'Noto Serif SC',serif;font-size:1.15rem}.card-title p{margin:5px 0 0;color:#65716c;font-size:.75rem}.settings-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.settings-grid .wide{grid-column:1/-1}label{display:flex;flex-direction:column;gap:7px}label>span{font-size:.78rem;font-weight:700}input,textarea{width:100%;border:1.5px solid rgba(49,95,86,.16);border-radius:10px;padding:10px 12px;background:#fffdf8;color:#283531;font:inherit;font-size:.88rem;line-height:1.6}input:focus,textarea:focus{outline:0;border-color:#315f56;box-shadow:0 0 0 3px rgba(49,95,86,.1)}textarea{resize:vertical}.portrait-editor{display:grid;grid-template-columns:180px 1fr;gap:24px;align-items:center;margin-bottom:20px}.portrait-editor img{width:180px;height:140px;border-radius:14px;object-fit:cover;background:#eee6da}.portrait-editor>div{display:flex;flex-direction:column;gap:16px}.upload-button{display:inline-flex;align-items:center;justify-content:center;width:max-content;padding:10px 14px;border-radius:9px;background:#315f56;color:#f9f1e5;cursor:pointer;font-size:.8rem;font-weight:700}.upload-button input{position:absolute;width:1px;height:1px;opacity:0}.tag-grid,.step-editors{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.step-editors>div,.repo-editors>div{padding:18px;border-radius:12px;background:#f2eadf}.step-editors strong{display:block;margin-bottom:13px;color:#507b93;font-size:.78rem}.step-editors label+label,.repo-editors label+label{margin-top:12px}.block-field{margin-top:18px}.repo-editors{display:flex;flex-direction:column;gap:12px}.repo-editor-head{display:flex;justify-content:space-between;margin-bottom:12px}.repo-editor-head button{border:0;background:transparent;color:#9a3f2d;cursor:pointer;font-weight:700}.repo-editor-head button:disabled{opacity:.35}.add-repo{margin-top:14px;border:1.5px dashed rgba(49,95,86,.28);border-radius:9px;padding:10px 14px;background:transparent;color:#315f56;cursor:pointer;font-weight:700}.settings-status{margin:18px 0;padding:14px 16px;border-radius:11px;font-size:.84rem}.settings-status.success{background:#e2ede5;color:#214e43}.settings-status.error{background:#f7ddd0;color:#7c3527}.settings-save{position:sticky;bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 20px;border-radius:16px;background:#315f56;color:#f9f1e5;box-shadow:0 16px 38px rgba(40,53,49,.2)}.settings-save div{display:flex;flex-direction:column}.settings-save span{margin-top:3px;font-size:.7rem;opacity:.72}.settings-save button{border:0;border-radius:10px;padding:12px 18px;background:#e8ad42;color:#283531;cursor:pointer;font-weight:800}.settings-save button:disabled{opacity:.5}
@media(max-width:900px){.home-settings{margin-inline:16px}.settings-grid,.tag-grid,.step-editors{grid-template-columns:1fr}.settings-grid .wide{grid-column:auto}}@media(max-width:600px){.portrait-editor{grid-template-columns:1fr}.settings-save{align-items:stretch;flex-direction:column}.settings-save button{width:100%}}
</style>
