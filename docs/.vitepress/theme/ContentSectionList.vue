<script setup lang="ts">
import { computed } from 'vue'
import { data as homeContent } from './home-content.data'

const props = defineProps<{ section: 'work' | 'agents' | 'skills' }>()
const isPublicSite = import.meta.env.VITE_PUBLIC_SITE === 'true'

const items = computed(() => homeContent.filter((item) => item.section === props.section))
</script>

<template>
  <div class="section-content-list">
    <article v-for="item in items" :key="item.url" class="section-content-card">
      <div class="card-meta">
        <span>{{ item.category }}</span>
        <time>{{ item.date || '持续更新' }}</time>
      </div>
      <h2><a :href="item.url">{{ item.title }}</a></h2>
      <p>{{ item.summary }}</p>
      <div class="card-actions">
        <a :href="item.url">阅读内容 →</a>
        <a v-if="!isPublicSite" :href="`/admin/?edit=${item.section}/${item.slug}`">修改</a>
      </div>
    </article>

    <div v-if="!items.length" class="section-empty">
      <strong>这个栏目暂时没有内容</strong>
      <a v-if="!isPublicSite" :href="`/admin/?section=${section}`">添加第一条 →</a>
    </div>
  </div>
</template>

<style scoped>
.section-content-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 40px; }
.section-content-card { display: flex; min-height: 230px; flex-direction: column; padding: 28px; border: 1px solid rgba(49,95,86,.13); border-radius: 14px; background: #fffaf2; box-shadow: 0 8px 24px rgba(49,95,86,.055); }
.card-meta { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #65716c; font-size: .72rem; }
.card-meta span { color: #507b93; font-weight: 700; }
.section-content-card h2 { margin: 18px 0 10px; border: 0; padding: 0; font-family: 'Noto Serif SC', serif; font-size: 1.2rem; line-height: 1.5; }
.section-content-card h2 a { color: #283531; text-decoration: none; }
.section-content-card > p { margin: 0; color: #65716c; font-size: .86rem; line-height: 1.8; }
.card-actions { display: flex; gap: 16px; margin-top: auto; padding-top: 24px; }
.card-actions a { color: #315f56; font-size: .78rem; font-weight: 700; text-decoration: none; }
.card-actions a:last-child { color: #e8783d; }
.section-empty { grid-column: 1 / -1; display: flex; min-height: 220px; flex-direction: column; align-items: center; justify-content: center; gap: 12px; border: 2px dashed rgba(49,95,86,.18); border-radius: 14px; color: #65716c; }
.section-empty a { color: #315f56; font-weight: 700; text-decoration: none; }
@media (max-width: 760px) { .section-content-list { grid-template-columns: 1fr; } }
</style>
