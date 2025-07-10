<template>
  <div :class="cardClasses" @click="handleClick" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <!-- 网站图标 -->
    <div class="website-icon-container">
      <img :src="iconUrl" :alt="`${website.name} icon`" class="website-icon" @error="handleIconError"
        @load="handleIconLoad" />
      <div v-if="isLoading" class="icon-loading">
        <div class="loading-spinner"></div>
      </div>
    </div>

    <!-- 网站信息 -->
    <div class="website-info">
      <h3 class="website-name">{{ website.name }}</h3>
      <p v-if="showDescription && website.description" class="website-description">
        {{ website.description }}
      </p>
      <div class="website-meta">
        <span class="website-domain">{{ domain }}</span>
        <div class="website-badges">
          <span v-if="website.isFavorite" class="favorite-badge">⭐</span>
          <span v-if="website.isPrivate" class="private-badge">🔒</span>
        </div>
      </div>
    </div>

    <!-- 悬停操作 -->
    <div v-if="showActions" class="website-actions">
      <button class="action-btn favorite-btn" :class="{ active: website.isFavorite }" @click.stop="toggleFavorite"
        :title="website.isFavorite ? '取消收藏' : '添加收藏'">
        <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
      <button class="action-btn visit-btn" @click.stop="visitWebsite" title="访问网站">
        <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
        </svg>
      </button>
    </div>

    <!-- 访问次数 -->
    <div v-if="showVisitCount && website.visitCount > 0" class="visit-count">
      {{ website.visitCount }} 次访问
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Website } from '@/types/website'
import { getWebsiteIcon, generateLetterIcon } from '@/utils/iconUtils'
import { extractDomain } from '@/utils/urlUtils'

// Props
interface Props {
  website: Website
  size?: 'sm' | 'md' | 'lg'
  showDescription?: boolean
  showActions?: boolean
  showVisitCount?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showDescription: true,
  showActions: true,
  showVisitCount: true,
  clickable: true,
})

// Emits
const emit = defineEmits<{
  click: [website: Website]
  favorite: [website: Website]
  visit: [website: Website]
}>()

// 状态
const isHovered = ref(false)
const isLoading = ref(true)
const iconUrl = ref('')
const iconError = ref(false)

// 计算属性
const domain = computed(() => extractDomain(props.website.url))

const cardClasses = computed(() => [
  'website-card',
  `website-card-${props.size}`,
  {
    'website-card-clickable': props.clickable,
    'website-card-hovered': isHovered.value,
    'website-card-favorite': props.website.isFavorite,
  }
])

// 方法
const handleClick = () => {
  if (props.clickable) {
    emit('click', props.website)
  }
}

const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}

const toggleFavorite = () => {
  emit('favorite', props.website)
}

const visitWebsite = () => {
  emit('visit', props.website)
  // 在新标签页打开网站
  window.open(props.website.url, '_blank', 'noopener,noreferrer')
}

const handleIconError = () => {
  if (!iconError.value) {
    iconError.value = true
    console.log(`Favicon failed for ${props.website.name}, trying alternative sources`)

    // 尝试直接从网站获取favicon
    const domain = extractDomain(props.website.url)
    const directFaviconUrl = `https://${domain}/favicon.ico`

    // 创建一个新的图片元素来测试直接favicon
    const testImg = new Image()
    testImg.onload = () => {
      iconUrl.value = directFaviconUrl
      isLoading.value = false
    }
    testImg.onerror = () => {
      // 如果直接favicon也失败，使用首字母图标
      console.log(`Direct favicon also failed for ${props.website.name}, using letter icon fallback`)
      iconUrl.value = generateLetterIcon(props.website.name)
      isLoading.value = false
    }
    testImg.src = directFaviconUrl
  }
}

const handleIconLoad = () => {
  isLoading.value = false
}

// 初始化图标
onMounted(async () => {
  try {
    // 直接使用Google Favicon API，错误处理由img的onError事件处理
    iconUrl.value = await getWebsiteIcon(props.website.url, props.website.name)
    isLoading.value = false
  } catch (error) {
    console.warn('Failed to load website icon:', error)
    iconUrl.value = generateLetterIcon(props.website.name)
    isLoading.value = false
  }
})
</script>

<style scoped>
.website-card {
  position: relative;
  background-color: white;
  border-radius: 0.75rem;
  border: 1px solid rgb(229 231 235);
  padding: 1.5rem;
  transition: all 0.2s ease-in-out;
  overflow: hidden;
}

.dark .website-card {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
}

.website-card-clickable {
  cursor: pointer;
}

.website-card-clickable:hover,
.website-card-hovered {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.dark .website-card-clickable:hover,
.dark .website-card-hovered {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.website-card-favorite {
  border-color: rgb(245 158 11);
}

.dark .website-card-favorite {
  border-color: rgb(245 158 11);
}

/* 尺寸变体 */
.website-card-sm {
  padding: 1rem;
}

.website-card-lg {
  padding: 2rem;
}

/* 图标容器 */
.website-icon-container {
  position: relative;
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
}

.website-card-sm .website-icon-container {
  width: 32px;
  height: 32px;
  margin-bottom: 0.75rem;
}

.website-card-lg .website-icon-container {
  width: 64px;
  height: 64px;
  margin-bottom: 1.25rem;
}

.website-icon {
  width: 100%;
  height: 100%;
  border-radius: 0.5rem;
  object-fit: cover;
}

.icon-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(249 250 251);
  border-radius: 0.5rem;
}

.dark .icon-loading {
  background-color: rgb(55 65 81);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgb(229 231 235);
  border-top: 2px solid rgb(59 130 246);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.dark .loading-spinner {
  border-color: rgb(75 85 99);
  border-top-color: rgb(59 130 246);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 网站信息 */
.website-info {
  flex: 1;
}

.website-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.dark .website-name {
  color: rgb(243 244 246);
}

.website-card-sm .website-name {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.website-card-lg .website-name {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.website-description {
  font-size: 0.875rem;
  color: rgb(107 114 128);
  margin-bottom: 0.75rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark .website-description {
  color: rgb(156 163 175);
}

.website-card-sm .website-description {
  font-size: 0.75rem;
  -webkit-line-clamp: 1;
}

.website-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.website-domain {
  color: rgb(107 114 128);
  font-weight: 500;
}

.dark .website-domain {
  color: rgb(156 163 175);
}

.website-badges {
  display: flex;
  gap: 0.25rem;
}

.favorite-badge,
.private-badge {
  font-size: 0.875rem;
}

/* 操作按钮 */
.website-actions {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s ease-in-out;
}

.website-card:hover .website-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  border: none;
  background-color: rgba(255, 255, 255, 0.9);
  color: rgb(107 114 128);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  backdrop-filter: blur(8px);
}

.dark .action-btn {
  background-color: rgba(31, 41, 55, 0.9);
  color: rgb(156 163 175);
}

.action-btn:hover {
  background-color: rgb(59 130 246);
  color: white;
  transform: scale(1.1);
}

.favorite-btn.active {
  background-color: rgb(245 158 11);
  color: white;
}

.action-icon {
  width: 16px;
  height: 16px;
}

/* 访问次数 */
.visit-count {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  font-size: 0.75rem;
  color: rgb(107 114 128);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  backdrop-filter: blur(8px);
}

.dark .visit-count {
  color: rgb(156 163 175);
  background-color: rgba(31, 41, 55, 0.9);
}
</style>
