<template>
  <div class="website-grid-container">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-grid">
        <div v-for="i in 8" :key="i" class="loading-card">
          <div class="loading-icon"></div>
          <div class="loading-text">
            <div class="loading-line long"></div>
            <div class="loading-line short"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="websites.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3s-4.5 4.03-4.5 9 2.015 9 4.5 9z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 3h.01" />
        </svg>
      </div>
      <h3 class="empty-title">还没有添加网站</h3>
      <p class="empty-description">
        开始添加你常用的网站，打造专属的个人导航页面
      </p>
      <button class="empty-action" @click="$emit('add-website')">
        <svg class="empty-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        添加第一个网站
      </button>
    </div>

    <!-- 网站网格 -->
    <div v-else :class="gridClasses">
      <WebsiteCard v-for="website in websites" :key="website.id" :website="website" :size="cardSize"
        :show-description="showDescriptions" :show-actions="showActions" :show-visit-count="showVisitCount"
        :clickable="clickable" @click="handleCardClick" @favorite="handleFavorite" @visit="handleVisit" />
    </div>

    <!-- 分页 -->
    <div v-if="showPagination && totalPages > 1" class="pagination">
      <button class="pagination-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
        <svg class="pagination-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
        上一页
      </button>

      <div class="pagination-info">
        第 {{ currentPage }} 页，共 {{ totalPages }} 页
      </div>

      <button class="pagination-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
        下一页
        <svg class="pagination-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Website } from '@/types/website'
import WebsiteCard from './WebsiteCard.vue'

// Props
interface Props {
  websites: Website[] | readonly Website[]
  isLoading?: boolean
  cardSize?: 'sm' | 'md' | 'lg'
  columns?: number | 'auto'
  showDescriptions?: boolean
  showActions?: boolean
  showVisitCount?: boolean
  clickable?: boolean
  showPagination?: boolean
  itemsPerPage?: number
  currentPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  cardSize: 'md',
  columns: 'auto',
  showDescriptions: true,
  showActions: true,
  showVisitCount: true,
  clickable: true,
  showPagination: false,
  itemsPerPage: 12,
  currentPage: 1,
})

// Emits
const emit = defineEmits<{
  'card-click': [website: Website]
  'favorite': [website: Website]
  'visit': [website: Website]
  'add-website': []
  'page-change': [page: number]
}>()

// 计算属性
const gridClasses = computed(() => {
  const baseClasses = ['website-grid']

  if (props.columns === 'auto') {
    // 响应式网格
    baseClasses.push('website-grid-responsive')
    baseClasses.push(`website-grid-${props.cardSize}`)
  } else {
    // 固定列数
    baseClasses.push(`website-grid-cols-${props.columns}`)
  }

  return baseClasses
})

const totalPages = computed(() => {
  if (!props.showPagination) return 1
  return Math.ceil(props.websites.length / props.itemsPerPage)
})

// 方法
const handleCardClick = (website: Website) => {
  emit('card-click', website)
}

const handleFavorite = (website: Website) => {
  emit('favorite', website)
}

const handleVisit = (website: Website) => {
  emit('visit', website)
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('page-change', page)
  }
}
</script>

<style scoped>
.website-grid-container {
  width: 100%;
}

/* 网站网格 */
.website-grid {
  display: grid;
  gap: 1.5rem;
  width: 100%;
}

/* 响应式网格 */
.website-grid-responsive {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.website-grid-responsive.website-grid-sm {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.website-grid-responsive.website-grid-lg {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

/* 固定列数网格 */
.website-grid-cols-1 {
  grid-template-columns: 1fr;
}

.website-grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.website-grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.website-grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.website-grid-cols-5 {
  grid-template-columns: repeat(5, 1fr);
}

.website-grid-cols-6 {
  grid-template-columns: repeat(6, 1fr);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .website-grid-responsive {
    grid-template-columns: 1fr;
  }

  .website-grid-cols-2,
  .website-grid-cols-3,
  .website-grid-cols-4,
  .website-grid-cols-5,
  .website-grid-cols-6 {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 641px) and (max-width: 768px) {

  .website-grid-cols-3,
  .website-grid-cols-4,
  .website-grid-cols-5,
  .website-grid-cols-6 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {

  .website-grid-cols-4,
  .website-grid-cols-5,
  .website-grid-cols-6 {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 加载状态 */
.loading-state {
  width: 100%;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.loading-card {
  background-color: white;
  border-radius: 0.75rem;
  border: 1px solid rgb(229 231 235);
  padding: 1.5rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.dark .loading-card {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
}

.loading-icon {
  width: 48px;
  height: 48px;
  background-color: rgb(229 231 235);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.dark .loading-icon {
  background-color: rgb(75 85 99);
}

.loading-text {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.loading-line {
  height: 1rem;
  background-color: rgb(229 231 235);
  border-radius: 0.25rem;
}

.dark .loading-line {
  background-color: rgb(75 85 99);
}

.loading-line.long {
  width: 80%;
}

.loading-line.short {
  width: 60%;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: rgb(156 163 175);
  margin-bottom: 1.5rem;
}

.dark .empty-icon {
  color: rgb(107 114 128);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin-bottom: 0.5rem;
}

.dark .empty-title {
  color: rgb(243 244 246);
}

.empty-description {
  font-size: 1rem;
  color: rgb(107 114 128);
  margin-bottom: 2rem;
  max-width: 400px;
}

.dark .empty-description {
  color: rgb(156 163 175);
}

.empty-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: rgb(59 130 246);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.empty-action:hover {
  background-color: rgb(37 99 235);
  transform: translateY(-1px);
}

.empty-action-icon {
  width: 20px;
  height: 20px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: white;
  color: rgb(107 114 128);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.dark .pagination-btn {
  background-color: rgb(31 41 55);
  color: rgb(156 163 175);
  border-color: rgb(75 85 99);
}

.pagination-btn:hover:not(:disabled) {
  background-color: rgb(59 130 246);
  color: white;
  border-color: rgb(59 130 246);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-icon {
  width: 16px;
  height: 16px;
}

.pagination-info {
  font-size: 0.875rem;
  color: rgb(107 114 128);
}

.dark .pagination-info {
  color: rgb(156 163 175);
}
</style>
