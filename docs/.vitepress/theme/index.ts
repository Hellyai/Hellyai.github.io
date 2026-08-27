import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HomeWorkbench from './HomeWorkbench.vue'
import ContentManager from './ContentManager.vue'
import WorkGallery from './WorkGallery.vue'
import ContentSectionList from './ContentSectionList.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeWorkbench', HomeWorkbench)
    if (import.meta.env.VITE_PUBLIC_SITE !== 'true') app.component('ContentManager', ContentManager)
    app.component('WorkGallery', WorkGallery)
    app.component('ContentSectionList', ContentSectionList)
  }
} satisfies Theme
