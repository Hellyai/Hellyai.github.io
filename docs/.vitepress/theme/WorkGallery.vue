<script setup lang="ts">
import { computed, ref } from 'vue'
import { data as works } from './works.data'

const active = ref('真实作品')
const tabs = ['真实作品', '全部内容']
const visibleWorks = computed(() => {
  const selected = active.value === '真实作品'
    ? works.filter((work) => work.status !== '示例')
    : works
  return [...selected].sort((a, b) => String(a.number).localeCompare(String(b.number)))
})
</script>

<template>
  <section class="work-gallery">
    <header class="gallery-intro">
      <div>
        <p class="gallery-label">OPEN-SOURCE LEGAL WORK</p>
        <h1>把法律经验，做成<br><span>可以运行的工具。</span></h1>
      </div>
      <div class="intro-note">
        <p>这里展示的不只是代码仓库，而是我如何把交易审阅、股权计算和基金条款知识转化为可复用的 AI 工作方法。</p>
        <a href="https://github.com/Hellyai" target="_blank" rel="noopener">访问我的 GitHub →</a>
      </div>
    </header>

    <div class="gallery-tabs" aria-label="作品筛选">
      <button v-for="tab in tabs" :key="tab" type="button" :class="{ active: active === tab }" @click="active = tab">{{ tab }}</button>
    </div>

    <div class="gallery-list">
      <article v-for="work in visibleWorks" :key="work.url" class="project-row" :class="{ sample: work.status === '示例' }">
        <div class="project-number">{{ work.number }}</div>
        <div class="project-main">
          <div class="project-meta">
            <span>{{ work.category }}</span>
            <span v-if="work.language">{{ work.language }}</span>
            <span v-if="work.license">{{ work.license }}</span>
            <span v-if="work.status === '示例'">展示样例</span>
          </div>
          <h2><a :href="work.url">{{ work.title }}</a></h2>
          <p>{{ work.summary }}</p>
          <ul v-if="work.capabilities?.length" class="capability-list">
            <li v-for="item in work.capabilities.slice(0, 3)" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="project-actions">
          <a class="detail-action" :href="work.url">查看作品</a>
          <a v-if="work.demo" :href="work.demo" target="_blank" rel="noopener">在线体验 ↗</a>
          <a v-if="work.github" :href="work.github" target="_blank" rel="noopener">GitHub ↗</a>
        </div>
      </article>
    </div>

    <footer class="gallery-footer">
      <strong>作品持续更新</strong>
      <span>每个项目均保留适用边界、隐私说明与专业复核要求。</span>
    </footer>
  </section>
</template>

<style scoped>
.work-gallery { color: var(--brand-ink); background: var(--brand-paper); }
.work-gallery a { color: inherit; text-decoration: none; }
.gallery-intro { display: grid; grid-template-columns: 1.15fr .55fr; gap: clamp(40px, 7vw, 110px); align-items: end; max-width: 1300px; margin: 0 auto; padding: clamp(76px, 10vw, 140px) clamp(24px, 4vw, 52px) clamp(56px, 8vw, 100px); }
.gallery-label { margin: 0 0 22px; color: var(--brand-orange); font-size: .72rem; font-weight: 700; letter-spacing: .17em; }
.gallery-intro h1 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: clamp(2.8rem, 6vw, 6rem); font-weight: 900; line-height: 1.12; letter-spacing: -.045em; }
.gallery-intro h1 span { position: relative; z-index: 0; }
.gallery-intro h1 span::after { content: ''; position: absolute; left: -.02em; right: -.03em; bottom: .06em; height: .22em; z-index: -1; background: rgba(232,173,66,.62); transform: rotate(-1deg); }
.intro-note { padding-bottom: 8px; }
.intro-note p { margin: 0 0 24px; color: var(--brand-muted); line-height: 1.9; }
.intro-note a { color: var(--brand-green); font-weight: 700; background: linear-gradient(transparent 62%, rgba(232,173,66,.48) 62%); }
.gallery-tabs { display: flex; gap: 8px; max-width: 1200px; margin: 0 auto 22px; padding: 0 clamp(24px, 4vw, 52px); }
.gallery-tabs button { border: 0; border-radius: 999px; padding: 9px 16px; background: rgba(49,95,86,.08); color: var(--brand-green); cursor: pointer; font: inherit; font-size: .8rem; font-weight: 700; }
.gallery-tabs button.active { background: var(--brand-green); color: #f8f1e7; }
.gallery-tabs button:focus-visible { outline: 3px solid rgba(232,173,66,.55); outline-offset: 3px; }
.gallery-list { max-width: 1200px; margin: 0 auto; padding: 0 clamp(24px, 4vw, 52px) clamp(70px, 10vw, 120px); border-top: 1px solid rgba(49,95,86,.16); }
.project-row { display: grid; grid-template-columns: 100px minmax(0, 1fr) 150px; gap: clamp(22px, 4vw, 56px); align-items: start; padding: clamp(34px, 5vw, 60px) 0; border-bottom: 1px solid rgba(49,95,86,.16); }
.project-row.sample { opacity: .7; }
.project-number { font-family: 'Fraunces', serif; font-size: clamp(3.2rem, 6vw, 5.8rem); font-style: italic; line-height: .9; color: rgba(49,95,86,.17); }
.project-meta { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 13px; }
.project-meta span { padding: 4px 8px; border-radius: 999px; background: #e6eeea; color: var(--brand-green); font-size: .68rem; font-weight: 700; }
.project-meta span:first-child { background: #f2d4bc; color: #754027; }
.project-main h2 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: clamp(1.45rem, 2.8vw, 2.25rem); line-height: 1.3; }
.project-main h2 a:hover { background: linear-gradient(transparent 67%, rgba(232,173,66,.48) 67%); }
.project-main > p { max-width: 720px; margin: 15px 0 0; color: var(--brand-muted); line-height: 1.85; }
.capability-list { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 20px 0 0; padding: 0; list-style: none; }
.capability-list li { position: relative; padding-left: 14px; color: #4c5954; font-size: .78rem; }
.capability-list li::before { content: ''; position: absolute; left: 0; top: .55em; width: 6px; height: 6px; border-radius: 50%; background: var(--brand-orange); }
.project-actions { display: flex; align-items: stretch; flex-direction: column; gap: 8px; }
.project-actions a { padding: 10px 12px; border-radius: 9px; color: var(--brand-green); font-size: .76rem; font-weight: 700; text-align: center; }
.project-actions a:hover { background: #e5ece8; }
.project-actions .detail-action { background: var(--brand-green); color: #f8f1e7; }
.project-actions .detail-action:hover { background: #244d45; }
.gallery-footer { display: flex; align-items: center; justify-content: space-between; gap: 30px; padding: 36px max(24px, calc((100vw - 1100px)/2)); background: #dce7e1; }
.gallery-footer strong { font-family: 'Noto Serif SC', serif; font-size: 1.15rem; }
.gallery-footer span { color: var(--brand-muted); font-size: .82rem; }
@media (max-width: 900px) { .gallery-intro { grid-template-columns: 1fr; } .intro-note { max-width: 650px; } .project-row { grid-template-columns: 78px minmax(0, 1fr); } .project-actions { grid-column: 2; flex-direction: row; flex-wrap: wrap; } }
@media (max-width: 600px) { .project-row { grid-template-columns: 1fr; } .project-number { font-size: 3.6rem; } .project-actions { grid-column: 1; } .gallery-footer { align-items: flex-start; flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
</style>
