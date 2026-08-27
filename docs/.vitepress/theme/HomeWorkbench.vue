<script setup lang="ts">
import { computed } from 'vue'
import { data as homeContent } from './home-content.data'
import homeConfig from '../home-config.json'

const isPublicSite = import.meta.env.VITE_PUBLIC_SITE === 'true'

const contentSections = [
  { key: 'work', label: '工作作品', description: '项目、成果与工作复盘', link: '/work/' },
  { key: 'agents', label: 'Agent 指令', description: '可以直接复用的角色与约束', link: '/agents/' },
  { key: 'skills', label: 'Skill 技能', description: '可重复执行的专业工作流', link: '/skills/' }
]

const contentGroups = computed(() => contentSections.map((section) => ({
  ...section,
  items: homeContent.filter((item) => item.section === section.key).slice(0, 3)
})))

const workflowRows = [
  { step: '01', action: '识别任务', why: '文件类型、委托方身份和目标先明确' },
  { step: '02', action: '拆解规则', why: '把经验写成路由、清单和计算口径' },
  { step: '03', action: '构造工具', why: '用 Skill 或交互网页承载工作方法' },
  { step: '04', action: '公开验证', why: '通过 GitHub 持续校正、迭代和复用' }
]
</script>

<template>
  <div class="helly-home">
    <!-- © ESTHER不二 esthersjw/esther-design-system CC BY-NC-SA 4.0；本页按其教程页方法重新组织 -->
    <section class="helly-hero">
      <div class="helly-hero-copy">
        <span class="helly-label">HELLYAI · LEGAL WORK AS A SYSTEM</span>
        <h1>{{ homeConfig.heroTitleBefore }}<br><span class="helly-highlight">{{ homeConfig.heroHighlight }}</span><span class="mobile-break"><br></span>{{ homeConfig.heroTitleAfter }}</h1>
        <p>{{ homeConfig.heroIntro }}</p>
        <div class="helly-actions">
          <a class="helly-primary" href="/work/">查看开源作品 <span>→</span></a>
          <a v-if="!isPublicSite" class="helly-secondary" href="/admin/?view=home">修改首页</a>
        </div>
      </div>
      <div class="portrait-stage" aria-label="HellyAI 个人形象">
        <div class="portrait-ring" aria-hidden="true"></div>
        <div class="portrait-window">
          <img :src="homeConfig.portraitUrl" :alt="homeConfig.portraitAlt">
        </div>
        <span v-for="(tag, index) in homeConfig.portraitTags" :key="tag" class="orbit-tag" :class="['orbit-one', 'orbit-two', 'orbit-three'][index]">{{ tag }}</span>
      </div>
    </section>

    <section class="method-section">
      <div class="home-container">
        <header class="section-heading">
          <span class="section-num">01</span>
          <h2>{{ homeConfig.methodTitle }}</h2>
          <p>{{ homeConfig.methodIntro }}</p>
        </header>
        <div class="method-flow">
          <article v-for="(item, index) in homeConfig.methodSteps" :key="item.label" class="method-step">
            <span class="method-dot">{{ index + 1 }}</span>
            <strong>{{ item.label }}</strong>
            <p>{{ item.description }}</p>
          </article>
        </div>
        <div class="method-quote">
          <span aria-hidden="true">“</span>
          <p>{{ homeConfig.coreQuote }}</p>
        </div>
      </div>
    </section>

    <section class="updates-section">
      <div class="home-container">
        <header class="section-heading compact-heading">
          <span class="section-num">02</span>
          <h2>AI工作流成果展示</h2>
          <p>{{ isPublicSite ? '三个栏目会随本机内容发布持续更新。' : '三个栏目与本机内容管理同步，保存修改后会自动更新这里。' }}</p>
        </header>
        <div class="updates-grid">
          <section v-for="group in contentGroups" :key="group.key" class="updates-column">
            <header><div><span>{{ group.label }}</span><p>{{ group.description }}</p></div><a :href="group.link">查看全部 →</a></header>
            <ul v-if="group.items.length">
              <li v-for="item in group.items" :key="item.url">
                <p><span>{{ item.category }}</span><time>{{ item.date || '持续更新' }}</time></p>
                <h3><a :href="item.url">{{ item.title }}</a></h3>
                <div class="update-links"><a :href="item.url">阅读</a><a v-if="!isPublicSite" :href="`/admin/?edit=${item.section}/${item.slug}`">修改</a></div>
              </li>
            </ul>
            <div v-else class="updates-empty"><span>尚未收录内容</span><a v-if="!isPublicSite" :href="`/admin/?section=${group.key}`">添加第一条 →</a></div>
          </section>
        </div>
      </div>
    </section>

    <section class="repo-section">
      <div class="home-container repo-layout">
        <header class="section-heading light-heading">
          <span class="section-num">03</span>
          <h2>作品结构</h2>
          <p>每个仓库对应一种将专业知识外化的方法。</p>
        </header>
        <div class="repo-window">
          <div class="repo-titlebar">
            <span class="repo-dots"><i></i><i></i><i></i></span>
            <span>github.com/Hellyai/</span>
          </div>
          <div class="repo-body">
            <a v-for="repo in homeConfig.repositories" :key="repo.url" :href="repo.url" target="_blank" rel="noopener">
              <strong>{{ repo.name }}</strong>
              <span>{{ repo.description }}</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="workflow-section">
      <div class="home-container workflow-layout">
        <aside class="workflow-side">
          <span class="big-four">4</span>
          <span class="section-num">04</span>
          <h2>从经验到作品</h2>
          <p>不是先决定做网页或 Skill，而是先找到专业判断中值得被复用的部分。</p>
        </aside>
        <div class="workflow-table">
          <div class="workflow-head"><span>步骤</span><span>动作</span><span>为什么</span></div>
          <div v-for="row in workflowRows" :key="row.step" class="workflow-row">
            <span>{{ row.step }}</span><strong>{{ row.action }}</strong><p>{{ row.why }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="closing-section">
      <div class="closing-copy">
        <span class="helly-label">A WORKBENCH, NOT A SHOWCASE</span>
        <h2>{{ homeConfig.closingTitle }}</h2>
        <p>{{ homeConfig.closingText }}</p>
        <div class="helly-actions">
          <a v-if="!isPublicSite" class="helly-primary" href="/admin/?view=manage">修改/管理内容 <span>→</span></a>
          <a class="helly-secondary" href="https://github.com/Hellyai" target="_blank" rel="noopener">访问 GitHub</a>
        </div>
      </div>
      <div class="closing-mark" aria-hidden="true">H</div>
    </section>

    <footer class="helly-footer">
      <span>HellyAI · 个人法律 AI 工作台</span>
      <span>Make judgment reusable.</span>
    </footer>
  </div>
</template>

<style scoped>
.helly-home { --home-blue: #86a9c0; --home-blue-deep: #507b93; --home-gold: #e8ad42; --home-orange: #e8783d; --home-green: #315f56; --home-ink: #283531; --home-muted: #65716c; --home-paper: #fbf6ee; --home-cream: #f4ecdf; --home-dark: #202f2b; color: var(--home-ink); overflow: hidden; background: var(--home-paper); }
.helly-home a { color: inherit; text-decoration: none; }
.home-container { width: min(100%, 1300px); margin: 0 auto; padding-inline: clamp(24px, 4vw, 52px); }
.helly-label { display: block; color: var(--home-blue-deep); font-size: .72rem; font-weight: 700; letter-spacing: .15em; }
.helly-hero { min-height: calc(100vh - 64px); display: grid; grid-template-columns: 1fr .5fr; gap: clamp(44px, 7vw, 100px); align-items: center; max-width: 1300px; margin: 0 auto; padding: clamp(80px, 10vw, 140px) clamp(24px, 4vw, 52px) clamp(70px, 9vw, 120px); }
.helly-hero-copy { min-width: 0; }
.helly-hero-copy h1 { margin: 18px 0 24px; font-family: 'Noto Serif SC', serif; font-size: clamp(2.6rem, 5.2vw, 4.5rem); font-weight: 900; line-height: 1.2; letter-spacing: -.045em; overflow-wrap: anywhere; }
.helly-highlight { padding: 0 .05em; background: linear-gradient(to top, rgba(232,173,66,.5) 34%, transparent 34%); -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.mobile-break { display: none; }
.helly-hero-copy > p { max-width: 620px; margin: 0; color: var(--home-muted); font-size: clamp(1rem, 1.3vw, 1.08rem); line-height: 1.9; }
.helly-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.helly-primary, .helly-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 18px; min-height: 48px; padding: 12px 20px; border-radius: 11px; font-size: .86rem; font-weight: 700; transition: transform .2s ease, background .2s ease; }
.helly-primary { background: var(--home-green); color: #f8f1e7 !important; box-shadow: 0 10px 26px rgba(49,95,86,.16); }
.helly-secondary { border: 1px solid rgba(49,95,86,.24); background: rgba(255,255,255,.38); }
.helly-primary:hover, .helly-secondary:hover { transform: translateY(-2px); }
.portrait-stage { position: relative; width: clamp(210px, 27vw, 320px); aspect-ratio: 1; justify-self: center; }
.portrait-ring { position: absolute; inset: -17px; border: 2px dashed rgba(80,123,147,.32); border-radius: 50%; }
.portrait-window { position: absolute; inset: 0; overflow: hidden; border-radius: 50%; background: #e5ded2; box-shadow: 0 18px 48px rgba(49,95,86,.13); }
.portrait-window img { width: 250%; height: 100%; max-width: none; object-fit: cover; object-position: 66% center; transform: translateX(-48%); }
.orbit-tag { position: absolute; z-index: 2; padding: 7px 13px; border-radius: 999px; background: #fffaf2; box-shadow: 0 4px 16px rgba(40,53,49,.09); font-size: .72rem; font-weight: 700; white-space: nowrap; }
.orbit-one { top: 3%; right: -25%; color: var(--home-green); }
.orbit-two { bottom: 4%; left: -24%; color: var(--home-orange); }
.orbit-three { right: -22%; bottom: 22%; color: var(--home-blue-deep); }
.method-section, .workflow-section { padding-block: clamp(86px, 12vh, 150px); }
.method-section { background: var(--home-cream); }
.section-heading { display: grid; grid-template-columns: 70px minmax(220px, .6fr) 1fr; gap: clamp(20px, 4vw, 54px); align-items: end; margin-bottom: clamp(46px, 6vw, 76px); }
.section-num { font-family: 'Fraunces', serif; font-size: clamp(1.5rem, 3vw, 2.1rem); font-style: italic; color: var(--home-blue-deep); opacity: .35; }
.section-heading h2, .workflow-side h2, .closing-copy h2 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: clamp(1.7rem, 3.2vw, 2.7rem); font-weight: 900; line-height: 1.35; }
.section-heading > p { margin: 0; max-width: 520px; justify-self: end; color: var(--home-muted); line-height: 1.8; }
.method-flow { position: relative; display: flex; flex-direction: column; gap: clamp(24px, 3vw, 38px); max-width: 820px; padding-left: 64px; }
.method-flow::before { content: ''; position: absolute; left: 22px; top: 30px; bottom: 30px; border-left: 2px dashed rgba(232,173,66,.75); }
.method-step { position: relative; padding: clamp(22px, 3vw, 34px); border-radius: 14px; background: #fffaf2; box-shadow: 0 4px 18px rgba(49,95,86,.045); }
.method-dot { position: absolute; left: -64px; top: 24px; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: var(--home-blue-deep); color: #f8f1e7; font-family: 'Fraunces', serif; font-weight: 700; }
.method-step strong { color: var(--home-blue-deep); font-size: .78rem; letter-spacing: .06em; }
.method-step p { margin: 8px 0 0; color: var(--home-muted); line-height: 1.75; }
.method-quote { position: relative; max-width: 900px; margin-top: clamp(42px, 6vw, 72px); padding: clamp(30px, 4vw, 46px); border: 2px solid rgba(232,173,66,.8); border-radius: 16px; background: #fffaf2; }
.method-quote > span { position: absolute; top: -17px; left: 22px; color: var(--home-gold); font-family: 'Fraunces', serif; font-size: 4.8rem; line-height: 1; }
.method-quote p { margin: 0; padding-left: 24px; font-family: 'Noto Serif SC', serif; font-size: clamp(1.12rem, 2.2vw, 1.55rem); font-weight: 700; line-height: 1.85; }
.compact-heading { grid-template-columns: 70px 1fr minmax(260px, .7fr); }
.project-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(18px, 2.5vw, 28px); }
.project-card { position: relative; display: flex; flex-direction: column; min-height: 470px; padding: clamp(26px, 3vw, 36px); border: 2px dashed rgba(80,123,147,.3); border-radius: 16px; background: #fffaf2; }
.project-card:nth-child(2) { border-color: rgba(232,173,66,.6); }
.project-card:nth-child(3) { border-color: rgba(232,120,61,.38); }
.project-label { position: absolute; top: -13px; left: 18px; padding: 1px 9px; background: var(--home-paper); color: var(--home-blue-deep); font-family: 'Caveat', cursive; font-size: 1rem; font-weight: 700; }
.project-card:nth-child(2) .project-label { color: #956a12; }
.project-card:nth-child(3) .project-label { color: var(--home-orange); }
.project-sigil { display: grid; place-items: center; width: 58px; height: 58px; margin-bottom: 24px; border-radius: 50%; background: #dbe7ed; color: var(--home-blue-deep); font-family: 'Fraunces', serif; font-size: 1.1rem; font-weight: 700; }
.project-card:nth-child(2) .project-sigil { background: #f7e4ad; color: #765813; }
.project-card:nth-child(3) .project-sigil { background: #f3d4c2; color: #8d4828; }
.project-category { margin: 0 0 8px; color: var(--home-muted); font-size: .7rem; font-weight: 700; letter-spacing: .08em; }
.project-card h3 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: 1.18rem; line-height: 1.55; }
.project-summary { margin: 13px 0 0; color: var(--home-muted); font-size: .84rem; line-height: 1.75; }
.project-card ul { display: flex; flex-direction: column; gap: 8px; margin: 22px 0 0; padding: 0; list-style: none; }
.project-card li { position: relative; padding-left: 14px; color: #4c5954; font-size: .76rem; line-height: 1.6; }
.project-card li::before { content: ''; position: absolute; left: 0; top: .55em; width: 6px; height: 6px; border-radius: 50%; background: var(--home-orange); }
.project-links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: auto; padding-top: 26px; }
.project-links a { color: var(--home-green); font-size: .76rem; font-weight: 700; }
.project-links a:hover { background: linear-gradient(transparent 60%, rgba(232,173,66,.5) 60%); }
.updates-section { padding-block: clamp(86px, 12vh, 150px); background: #e7eee9; }
.updates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(18px, 2.5vw, 28px); }
.updates-column { min-width: 0; padding: clamp(24px, 3vw, 34px); border-radius: 16px; background: #fffaf2; box-shadow: 0 5px 22px rgba(49,95,86,.055); }
.updates-column > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-bottom: 18px; border-bottom: 2px solid rgba(49,95,86,.1); }
.updates-column > header span { font-family: 'Noto Serif SC', serif; font-size: 1.08rem; font-weight: 900; }
.updates-column > header p { margin: 5px 0 0; color: var(--home-muted); font-size: .72rem; }
.updates-column > header > a { flex: none; color: var(--home-green); font-size: .72rem; font-weight: 700; }
.updates-column ul { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.updates-column li { padding: 20px 0; border-bottom: 1px solid rgba(49,95,86,.11); }
.updates-column li:last-child { border-bottom: 0; padding-bottom: 0; }
.updates-column li > p { display: flex; justify-content: space-between; gap: 12px; margin: 0 0 8px; color: var(--home-muted); font-size: .66rem; }
.updates-column li > p span { color: var(--home-blue-deep); font-weight: 700; }
.updates-column h3 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: .92rem; line-height: 1.55; }
.update-links { display: flex; gap: 12px; margin-top: 11px; }
.update-links a { color: var(--home-green); font-size: .7rem; font-weight: 700; }
.update-links a:last-child { color: var(--home-orange); }
.updates-empty { display: flex; min-height: 180px; flex-direction: column; align-items: flex-start; justify-content: center; gap: 10px; color: var(--home-muted); font-size: .78rem; }
.updates-empty a { color: var(--home-green); font-weight: 700; }
.repo-section { padding-block: clamp(74px, 10vh, 124px); background: var(--home-dark); color: #eee8dc; }
.repo-layout { display: grid; grid-template-columns: .36fr 1fr; gap: clamp(44px, 8vw, 110px); align-items: start; }
.light-heading { display: block; margin: 0; }
.light-heading h2 { margin: 8px 0 14px; }
.light-heading p { color: #b8c4bf; line-height: 1.8; }
.light-heading .section-num { color: var(--home-gold); }
.repo-window { overflow: hidden; border-radius: 13px; box-shadow: 0 18px 56px rgba(0,0,0,.28); }
.repo-titlebar { display: flex; align-items: center; gap: 18px; padding: 13px 16px; background: #31423d; color: #aebcb7; font-size: .72rem; }
.repo-dots { display: flex; gap: 6px; }
.repo-dots i { width: 10px; height: 10px; border-radius: 50%; background: #d96d55; }
.repo-dots i:nth-child(2) { background: #e8ad42; }
.repo-dots i:nth-child(3) { background: #7ba68f; }
.repo-body { display: flex; flex-direction: column; background: #17231f; }
.repo-body a { display: grid; grid-template-columns: minmax(200px, .7fr) 1fr; gap: 24px; padding: 22px clamp(22px, 3vw, 34px); border-bottom: 1px solid rgba(238,232,220,.09); }
.repo-body a:last-child { border-bottom: 0; }
.repo-body a:hover { background: #22332e; }
.repo-body strong { color: #efc46e; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .84rem; }
.repo-body span { color: #aebcb7; font-size: .78rem; line-height: 1.7; }
.workflow-layout { display: grid; grid-template-columns: .36fr 1fr; gap: clamp(50px, 8vw, 120px); align-items: start; }
.workflow-side { position: sticky; top: 110px; }
.big-four { display: block; margin-bottom: -24px; color: rgba(80,123,147,.13); font-family: 'Fraunces', serif; font-size: clamp(7rem, 15vw, 13rem); font-style: italic; line-height: .8; }
.workflow-side h2 { margin: 10px 0 16px; }
.workflow-side p { color: var(--home-muted); line-height: 1.85; }
.workflow-table { border-top: 2px solid var(--home-green); }
.workflow-head, .workflow-row { display: grid; grid-template-columns: 70px minmax(140px, .45fr) 1fr; gap: 18px; align-items: center; }
.workflow-head { padding: 13px 16px; background: #e5ece8; color: var(--home-green); font-size: .7rem; font-weight: 700; }
.workflow-row { padding: 24px 16px; border-bottom: 1px solid rgba(49,95,86,.15); }
.workflow-row > span { color: var(--home-blue-deep); font-family: 'Fraunces', serif; font-style: italic; }
.workflow-row strong { font-family: 'Noto Serif SC', serif; font-size: .92rem; }
.workflow-row p { margin: 0; color: var(--home-muted); font-size: .82rem; line-height: 1.7; }
.closing-section { display: grid; grid-template-columns: 1fr .35fr; align-items: center; min-height: 560px; overflow: hidden; background: #dce7e1; }
.closing-copy { padding: clamp(80px, 10vw, 150px); }
.closing-copy h2 { margin: 18px 0 20px; font-size: clamp(2.4rem, 5.5vw, 5.2rem); letter-spacing: -.04em; }
.closing-copy > p { max-width: 580px; margin: 0; color: var(--home-muted); line-height: 1.9; }
.closing-mark { align-self: stretch; display: grid; place-items: center; min-width: 260px; color: rgba(251,246,238,.55); background: var(--home-blue); font-family: 'Fraunces', serif; font-size: clamp(12rem, 25vw, 24rem); font-style: italic; line-height: 1; }
.helly-footer { display: flex; justify-content: space-between; gap: 30px; padding: 28px clamp(24px, 5vw, 72px); background: var(--home-dark); color: #eee8dc; font-size: .72rem; letter-spacing: .04em; }
@media (max-width: 900px) { .helly-hero { grid-template-columns: 1fr; } .portrait-stage { order: -1; width: min(58vw, 290px); } .section-heading, .compact-heading { grid-template-columns: 56px 1fr; align-items: start; } .section-heading > p { grid-column: 1 / -1; justify-self: start; } .project-grid, .updates-grid { grid-template-columns: 1fr; } .project-card { min-height: 0; } .repo-layout, .workflow-layout { grid-template-columns: 1fr; } .workflow-side { position: static; } .repo-body a { grid-template-columns: 1fr; gap: 7px; } .closing-section { grid-template-columns: 1fr; } .closing-mark { min-height: 220px; } }
@media (max-width: 600px) { .helly-hero-copy h1 { font-size: clamp(2.25rem, 11.5vw, 2.8rem); letter-spacing: -.04em; } .mobile-break { display: inline; } .helly-actions { align-items: stretch; flex-direction: column; } .orbit-one { right: 0; } .orbit-two { left: 0; } .orbit-three { right: -2%; } .section-heading { grid-template-columns: 1fr; } .method-flow { padding-left: 54px; } .method-dot { left: -54px; } .method-flow::before { left: 22px; } .method-quote p { padding-left: 0; } .workflow-head, .workflow-row { grid-template-columns: 48px 1fr; } .workflow-head span:last-child, .workflow-row p { grid-column: 2; } .closing-copy { padding-inline: 24px; } .helly-footer { flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
</style>
