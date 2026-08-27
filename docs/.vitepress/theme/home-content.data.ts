import { createContentLoader } from 'vitepress'

const sectionLabels = { work: '工作作品', agents: 'Agent 指令', skills: 'Skill 技能' } as const

export default createContentLoader(['work/*.md', 'agents/*.md', 'skills/*.md'], {
  transform(raw) {
    return raw
      .filter((item) => !['/work/', '/agents/', '/skills/'].includes(item.url))
      .map(({ url, frontmatter }) => {
        const parts = url.split('/').filter(Boolean)
        const section = parts[0] as keyof typeof sectionLabels
        const slug = parts.at(-1) ?? ''
        return {
          url, section, sectionLabel: sectionLabels[section], slug,
          title: String(frontmatter.title ?? slug), date: String(frontmatter.date ?? ''),
          category: String(frontmatter.category ?? sectionLabels[section]),
          summary: String(frontmatter.summary ?? frontmatter.description ?? '打开查看完整内容。')
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN'))
  }
})
