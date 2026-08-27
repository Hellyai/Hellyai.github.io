import { createContentLoader } from 'vitepress'

export default createContentLoader('work/*.md', {
  excerpt: true,
  transform(raw) {
    return raw
      .filter((item) => item.url !== '/work/')
      .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date))
      .map(({ url, frontmatter }) => ({
        url,
        title: frontmatter.title,
        date: frontmatter.date,
        category: frontmatter.category,
        summary: frontmatter.summary,
        number: frontmatter.number ?? '00',
        status: frontmatter.status ?? '作品',
        language: frontmatter.language ?? '',
        license: frontmatter.license ?? '',
        github: frontmatter.github ?? '',
        demo: frontmatter.demo ?? '',
        capabilities: frontmatter.capabilities ?? []
      }))
  }
})
