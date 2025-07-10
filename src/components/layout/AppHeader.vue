<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Logo和标题 -->
      <div class="header-brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 class="brand-title">Echo Nav</h1>
      </div>

      <!-- 搜索框 -->
      <div class="header-search">
        <div class="search-container">
          <div class="search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input v-model="searchQuery" type="text" class="search-input" placeholder="搜索网站..." @input="handleSearch"
            @focus="handleSearchFocus" @blur="handleSearchBlur" @keydown.escape="clearSearch" />
          <button v-if="searchQuery" class="search-clear" @click="clearSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="header-actions">
        <!-- 视图切换 -->
        <div class="view-toggle">
          <button v-for="view in viewOptions" :key="view.value"
            :class="['view-btn', { active: currentView === view.value }]" :title="view.label"
            @click="setView(view.value)">
            <svg class="view-icon" viewBox="0 0 24 24" fill="currentColor">
              <path :d="view.icon" />
            </svg>
          </button>
        </div>

        <!-- 添加网站 -->
        <button class="action-btn add-btn" title="添加网站" @click="$emit('add-website')">
          <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <!-- 主题切换 -->
        <button class="action-btn theme-btn" :title="getThemeLabel()" @click="toggleTheme">
          <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
            <path :d="getThemeIconPath()" />
          </svg>
        </button>

        <!-- GitHub同步 -->
        <button class="action-btn sync-btn" title="GitHub同步" @click="$emit('open-settings')">
          <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </button>

        <!-- 设置 -->
        <button class="action-btn settings-btn" title="设置" @click="$emit('open-settings')">
          <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

// Props
interface Props {
  currentView?: 'grid' | 'list' | 'compact'
}

const props = withDefaults(defineProps<Props>(), {
  currentView: 'grid',
})

// Emits
const emit = defineEmits<{
  'search': [query: string]
  'view-change': [view: 'grid' | 'list' | 'compact']
  'add-website': []
  'open-settings': []
}>()

// 主题管理
const { theme, toggleTheme, getThemeLabel } = useTheme()

// 状态
const searchQuery = ref('')
const isSearchFocused = ref(false)

// 视图选项
const viewOptions = [
  {
    value: 'grid' as const,
    label: '网格视图',
    icon: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z'
  },
  {
    value: 'list' as const,
    label: '列表视图',
    icon: 'M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z'
  },
  {
    value: 'compact' as const,
    label: '紧凑视图',
    icon: 'M3 4h18v2H3V4zm0 4h18v2H3V8zm0 4h18v2H3v-2zm0 4h18v2H3v-2z'
  }
]

// 方法
const handleSearch = () => {
  emit('search', searchQuery.value)
}

const handleSearchFocus = () => {
  isSearchFocused.value = true
}

const handleSearchBlur = () => {
  isSearchFocused.value = false
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('search', '')
}

const setView = (view: 'grid' | 'list' | 'compact') => {
  emit('view-change', view)
}

// 获取主题图标的SVG路径
const getThemeIconPath = () => {
  switch (theme.value) {
    case 'light':
      return 'M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z'
    case 'dark':
      return 'M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z'
    case 'system':
    default:
      return 'M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z'
  }
}
</script>

<style scoped>
.app-header {
  background-color: white;
  border-bottom: 1px solid rgb(229 231 235);
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}

.dark .app-header {
  background-color: rgba(17, 24, 39, 0.95);
  border-bottom-color: rgb(75 85 99);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* 品牌区域 */
.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  color: rgb(59 130 246);
}

.brand-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .brand-title {
  color: rgb(243 244 246);
}

/* 搜索区域 */
.header-search {
  flex: 1;
  max-width: 500px;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 20px;
  height: 20px;
  color: rgb(156 163 175);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  background-color: white;
  color: rgb(17 24 39);
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;
}

.dark .search-input {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

.search-input:focus {
  outline: none;
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-input::placeholder {
  color: rgb(156 163 175);
}

.dark .search-input::placeholder {
  color: rgb(107 114 128);
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  width: 20px;
  height: 20px;
  color: rgb(156 163 175);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
}

.search-clear:hover {
  color: rgb(107 114 128);
}

/* 操作区域 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

/* 视图切换 */
.view-toggle {
  display: flex;
  background-color: rgb(249 250 251);
  border-radius: 0.5rem;
  padding: 0.25rem;
}

.dark .view-toggle {
  background-color: rgb(55 65 81);
}

.view-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  border-radius: 0.25rem;
  color: rgb(107 114 128);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.dark .view-btn {
  color: rgb(156 163 175);
}

.view-btn:hover {
  background-color: white;
  color: rgb(59 130 246);
}

.dark .view-btn:hover {
  background-color: rgb(31 41 55);
  color: rgb(59 130 246);
}

.view-btn.active {
  background-color: white;
  color: rgb(59 130 246);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.dark .view-btn.active {
  background-color: rgb(31 41 55);
  color: rgb(59 130 246);
}

.view-icon {
  width: 18px;
  height: 18px;
}

/* 操作按钮 */
.action-btn {
  width: 40px;
  height: 40px;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  background-color: white;
  color: rgb(107 114 128);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.dark .action-btn {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
  color: rgb(156 163 175);
}

.action-btn:hover {
  background-color: rgb(59 130 246);
  border-color: rgb(59 130 246);
  color: white;
  transform: translateY(-1px);
}

.add-btn:hover {
  background-color: rgb(34 197 94);
  border-color: rgb(34 197 94);
}

.sync-btn {
  background-color: rgb(239 246 255);
  border-color: rgb(59 130 246);
  color: rgb(59 130 246);
}

.dark .sync-btn {
  background-color: rgb(30 58 138);
  border-color: rgb(59 130 246);
  color: rgb(147 197 253);
}

.sync-btn:hover {
  background-color: rgb(59 130 246);
  border-color: rgb(59 130 246);
  color: white;
}

.action-icon {
  width: 20px;
  height: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-container {
    padding: 0.75rem;
    gap: 1rem;
  }

  .brand-title {
    display: none;
  }

  .header-search {
    max-width: none;
  }

  .view-toggle {
    display: none;
  }

  .header-actions {
    gap: 0.5rem;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .header-container {
    gap: 0.75rem;
  }

  .search-input {
    padding: 0.5rem 0.75rem 0.5rem 2.25rem;
    font-size: 0.8rem;
  }

  .search-icon {
    width: 16px;
    height: 16px;
    left: 0.5rem;
  }

  .action-icon {
    width: 18px;
    height: 18px;
  }
}
</style>
