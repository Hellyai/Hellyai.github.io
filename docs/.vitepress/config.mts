import { defineConfig } from 'vitepress'
import { localContentPlugin } from './local-content-plugin.mts'

const isPublicSite = process.env.VITE_PUBLIC_SITE === 'true'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Helly的AI工作台',
  description: '把工作、方法和灵感整理成可复用的个人知识工作台',
  base: '/',
  srcExclude: isPublicSite ? ['admin/**', 'guide/upload-content.md', 'tutorials/**', 'tools/**'] : [],
  cleanUrls: true,
  appearance: false,
  lastUpdated: true,
  vite: {
    plugins: [localContentPlugin()]
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#315f56' }]
  ],
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '工作作品', link: '/work/' },
      { text: 'Agent 指令', link: '/agents/' },
      { text: 'Skill 技能', link: '/skills/' },
      ...(!isPublicSite ? [{ text: '内容管理', link: '/admin/' }] : [])
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索工作台', buttonAriaLabel: '搜索工作台' },
          modal: { noResultsText: '没有找到相关内容' }
        }
      }
    },
    sidebar: {
      '/work/': [
        { text: '工作作品', items: [
          { text: '全部作品', link: '/work/' },
          { text: '交易法律 Skills', link: '/work/transaction-legal-skills' },
          { text: 'Cap Table Skill', link: '/work/cap-table-skill' },
          { text: 'LPA 条款图谱', link: '/work/lpa-clause-map' },
        ] },
        { text: '展示样例', collapsed: true, items: [
          { text: '示例：AI 工作流', link: '/work/ai-workflow' },
          { text: '示例：内容系统', link: '/work/content-system' },
          { text: '示例：研究项目', link: '/work/research-project' }
        ] }
      ],
      '/agents/': [{ text: 'Agent 指令', items: [{ text: '指令库', link: '/agents/' }] }],
      '/skills/': [{ text: 'Skill 技能', items: [{ text: '技能库', link: '/skills/' }] }],
      ...(!isPublicSite ? {
        '/guide/': [{ text: '网站维护', items: [{ text: '如何上传工作内容', link: '/guide/upload-content' }] }],
        '/admin/': [{ text: '本机内容管理', items: [
          { text: '新增内容', link: '/admin/' },
          { text: '上传说明', link: '/guide/upload-content' }
        ] }]
      } : {})
    },
    socialLinks: [],
    footer: {
      message: '把每一次工作，整理成下一次可以复用的方法。',
      copyright: '© 2026 Helly的AI工作台 · Design system inspired by ESTHER不二'
    },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '更新于' },
    outline: { label: '本页目录' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '外观'
  }
})
