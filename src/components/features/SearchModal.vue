<template>
  <Teleport to="body">
    <div v-if="isActive" class="search-modal-overlay" @click="handleOverlayClick">
      <div class="search-modal" @click.stop>
        <!-- 搜索输入框 -->
        <div class="search-input-container">
          <div class="search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input ref="searchInput" v-model="query" type="text" placeholder="搜索网站..." class="search-input"
            @keydown="handleKeyDown" @input="handleInput" />
          <div v-if="isLoading" class="search-loading">
            <div class="loading-spinner"></div>
          </div>
          <div v-if="hasQuery" class="search-clear" @click="clearSearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        </div>

        <!-- 快捷键提示 -->
        <div class="search-shortcuts">
          <span class="shortcut-item">
            <kbd>↑</kbd><kbd>↓</kbd> 导航
          </span>
          <span class="shortcut-item">
            <kbd>⏎</kbd> 选择
          </span>
          <span class="shortcut-item">
            <kbd>Esc</kbd> 关闭
          </span>
        </div>

        <!-- 搜索内容 -->
        <div class="search-content">
          <!-- 搜索结果 -->
          <div v-if="hasResults" class="search-results">
            <div class="results-header">
              <h3 class="results-title">搜索结果</h3>
              <span class="results-count">{{ totalResults }} 个结果</span>
            </div>

            <div class="results-list">
              <div v-for="(result, index) in results" :key="result.item.id" class="result-item"
                :class="{ active: selectedIndex === index }" @click="selectResult(index)"
                @mouseenter="selectedIndex = index">
                <div class="result-icon">
                  <WebsiteIcon :website-url="result.item.url" :website-name="result.item.name" />
                </div>

                <div class="result-content">
                  <div class="result-title" v-html="highlightText(result.item.name, query)"></div>
                  <div class="result-url">{{ formatUrl(result.item.url) }}</div>
                  <div v-if="result.item.description" class="result-description">
                    {{ result.item.description }}
                  </div>
                  <div v-if="result.item.tags.length" class="result-tags">
                    <span v-for="tag in result.item.tags.slice(0, 3)" :key="tag" class="result-tag">
                      {{ tag }}
                    </span>
                  </div>
                </div>

                <div class="result-meta">
                  <div v-if="result.item.isFavorite" class="result-favorite">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path
                        d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                  </div>
                  <div class="result-score">{{ Math.round(result.score * 100) }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 搜索建议 -->
          <div v-else-if="suggestions.length && hasQuery" class="search-suggestions">
            <h3 class="suggestions-title">搜索建议</h3>
            <div class="suggestions-list">
              <div v-for="suggestion in suggestions" :key="suggestion" class="suggestion-item"
                @click="selectSuggestion(suggestion)">
                <div class="suggestion-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <span class="suggestion-text">{{ suggestion }}</span>
              </div>
            </div>
          </div>

          <!-- 搜索历史和热门 -->
          <div v-else class="search-default">
            <!-- 搜索历史 -->
            <div v-if="history.length" class="search-section">
              <div class="section-header">
                <h3 class="section-title">最近搜索</h3>
                <button class="section-action" @click="clearHistory">清除</button>
              </div>
              <div class="history-list">
                <div v-for="item in history.slice(0, 5)" :key="item" class="history-item" @click="selectHistory(item)">
                  <div class="history-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
                    </svg>
                  </div>
                  <span class="history-text">{{ item }}</span>
                  <button class="history-remove" @click.stop="removeFromHistory(item)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- 热门搜索 -->
            <div class="search-section">
              <h3 class="section-title">热门网站</h3>
              <div class="popular-list">
                <div v-for="popular in getPopularSearches().slice(0, 5)" :key="popular" class="popular-item"
                  @click="selectSuggestion(popular)">
                  <div class="popular-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon
                        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  </div>
                  <span class="popular-text">{{ popular }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 无结果 -->
          <div v-if="hasQuery && !hasResults && !isLoading && !suggestions.length" class="search-empty">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h3 class="empty-title">未找到相关结果</h3>
            <p class="empty-description">
              尝试使用不同的关键词或检查拼写
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useSearch } from '@/composables/useSearch'
import { useSearchShortcuts } from '@/composables/useKeyboard'
import WebsiteIcon from '@/components/ui/WebsiteIcon.vue'

// 搜索功能
const {
  query,
  results,
  suggestions,
  history,
  isLoading,
  isActive,
  selectedIndex,
  hasResults,
  hasQuery,
  totalResults,
  setQuery,
  clearSearch,
  activateSearch,
  deactivateSearch,
  selectResult,
  selectSuggestion,
  selectHistory,
  clearHistory,
  removeFromHistory,
  navigateUp,
  navigateDown,
  selectCurrent,
  getPopularSearches,
} = useSearch()

// 快捷键
const { registerSearchShortcuts, unregisterSearchShortcuts } = useSearchShortcuts()

// 引用
const searchInput = ref<HTMLInputElement>()

// 方法
const handleOverlayClick = () => {
  deactivateSearch()
}

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      navigateUp()
      break
    case 'ArrowDown':
      event.preventDefault()
      navigateDown()
      break
    case 'Enter':
      event.preventDefault()
      selectCurrent()
      break
    case 'Escape':
      event.preventDefault()
      deactivateSearch()
      break
  }
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  setQuery(target.value)
}


const highlightText = (text: string, searchQuery: string): string => {
  if (!searchQuery.trim()) return text

  const regex = new RegExp(`(${searchQuery})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

const formatUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname + urlObj.pathname
  } catch {
    return url
  }
}

// 打开搜索
const openSearch = () => {
  activateSearch()
  nextTick(() => {
    searchInput.value?.focus()
  })
}

// 关闭搜索
const closeSearch = () => {
  deactivateSearch()
}

// 注册快捷键
onMounted(() => {
  registerSearchShortcuts({
    onOpenSearch: openSearch,
    onCloseSearch: closeSearch,
  })
})

// 注销快捷键
onUnmounted(() => {
  unregisterSearchShortcuts()
})

// 暴露方法给父组件
defineExpose({
  openSearch,
  closeSearch,
})
</script>

<style scoped>
.search-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh 1rem 1rem;
}

.search-modal {
  width: 100%;
  max-width: 600px;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: searchModalEnter 0.2s ease-out;
}

.dark .search-modal {
  background-color: rgb(31 41 55);
  border: 1px solid rgb(75 85 99);
}

@keyframes searchModalEnter {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 搜索输入框 */
.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgb(229 231 235);
}

.dark .search-input-container {
  border-bottom-color: rgb(75 85 99);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: rgb(107 114 128);
  margin-right: 0.75rem;
}

.dark .search-icon {
  color: rgb(156 163 175);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.125rem;
  color: rgb(17 24 39);
}

.dark .search-input {
  color: rgb(243 244 246);
}

.search-input::placeholder {
  color: rgb(156 163 175);
}

.dark .search-input::placeholder {
  color: rgb(107 114 128);
}

.search-loading {
  margin-left: 0.75rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
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

.search-clear {
  width: 20px;
  height: 20px;
  color: rgb(107 114 128);
  cursor: pointer;
  margin-left: 0.75rem;
  transition: color 0.2s ease-in-out;
}

.search-clear:hover {
  color: rgb(75 85 99);
}

.dark .search-clear {
  color: rgb(156 163 175);
}

.dark .search-clear:hover {
  color: rgb(209 213 219);
}

/* 快捷键提示 */
.search-shortcuts {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: rgb(249 250 251);
  border-bottom: 1px solid rgb(229 231 235);
  font-size: 0.75rem;
  color: rgb(107 114 128);
}

.dark .search-shortcuts {
  background-color: rgb(55 65 81);
  border-bottom-color: rgb(75 85 99);
  color: rgb(156 163 175);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

kbd {
  padding: 0.125rem 0.25rem;
  background-color: white;
  border: 1px solid rgb(209 213 219);
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-family: monospace;
  color: rgb(75 85 99);
}

.dark kbd {
  background-color: rgb(75 85 99);
  border-color: rgb(107 114 128);
  color: rgb(209 213 219);
}

/* 搜索内容 */
.search-content {
  max-height: 60vh;
  overflow-y: auto;
}

/* 搜索结果 */
.search-results {
  padding: 1rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.results-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .results-title {
  color: rgb(243 244 246);
}

.results-count {
  font-size: 0.75rem;
  color: rgb(107 114 128);
}

.dark .results-count {
  color: rgb(156 163 175);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.result-item:hover,
.result-item.active {
  background-color: rgb(249 250 251);
}

.dark .result-item:hover,
.dark .result-item.active {
  background-color: rgb(55 65 81);
}

.result-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.website-icon {
  width: 100%;
  height: 100%;
  border-radius: 0.375rem;
  object-fit: cover;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-weight: 500;
  color: rgb(17 24 39);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .result-title {
  color: rgb(243 244 246);
}

.result-url {
  font-size: 0.75rem;
  color: rgb(107 114 128);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .result-url {
  color: rgb(156 163 175);
}

.result-description {
  font-size: 0.75rem;
  color: rgb(107 114 128);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .result-description {
  color: rgb(156 163 175);
}

.result-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.result-tag {
  padding: 0.125rem 0.375rem;
  background-color: rgb(239 246 255);
  color: rgb(59 130 246);
  border-radius: 0.25rem;
  font-size: 0.625rem;
}

.dark .result-tag {
  background-color: rgb(30 58 138);
  color: rgb(147 197 253);
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.result-favorite {
  width: 16px;
  height: 16px;
  color: rgb(239 68 68);
}

.result-score {
  font-size: 0.625rem;
  color: rgb(107 114 128);
  background-color: rgb(243 244 246);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

.dark .result-score {
  color: rgb(156 163 175);
  background-color: rgb(75 85 99);
}

/* 搜索建议 */
.search-suggestions {
  padding: 1rem;
}

.suggestions-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0 0 0.75rem 0;
}

.dark .suggestions-title {
  color: rgb(243 244 246);
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.suggestion-item:hover {
  background-color: rgb(249 250 251);
}

.dark .suggestion-item:hover {
  background-color: rgb(55 65 81);
}

.suggestion-icon {
  width: 16px;
  height: 16px;
  color: rgb(107 114 128);
}

.dark .suggestion-icon {
  color: rgb(156 163 175);
}

.suggestion-text {
  color: rgb(17 24 39);
}

.dark .suggestion-text {
  color: rgb(243 244 246);
}

/* 默认内容 */
.search-default {
  padding: 1rem;
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .section-title {
  color: rgb(243 244 246);
}

.section-action {
  font-size: 0.75rem;
  color: rgb(107 114 128);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
}

.section-action:hover {
  color: rgb(59 130 246);
}

.dark .section-action {
  color: rgb(156 163 175);
}

.dark .section-action:hover {
  color: rgb(147 197 253);
}

.history-list,
.popular-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item,
.popular-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.history-item:hover,
.popular-item:hover {
  background-color: rgb(249 250 251);
}

.dark .history-item:hover,
.dark .popular-item:hover {
  background-color: rgb(55 65 81);
}

.history-icon,
.popular-icon {
  width: 16px;
  height: 16px;
  color: rgb(107 114 128);
}

.dark .history-icon,
.dark .popular-icon {
  color: rgb(156 163 175);
}

.history-text,
.popular-text {
  flex: 1;
  color: rgb(17 24 39);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .history-text,
.dark .popular-text {
  color: rgb(243 244 246);
}

.history-remove {
  width: 16px;
  height: 16px;
  color: rgb(156 163 175);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
}

.history-remove:hover {
  color: rgb(239 68 68);
}

/* 空状态 */
.search-empty {
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: rgb(156 163 175);
}

.dark .empty-icon {
  color: rgb(107 114 128);
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0 0 0.5rem 0;
}

.dark .empty-title {
  color: rgb(243 244 246);
}

.empty-description {
  color: rgb(107 114 128);
  margin: 0;
}

.dark .empty-description {
  color: rgb(156 163 175);
}

/* 搜索高亮 */
:deep(.search-highlight) {
  background-color: rgb(254 240 138);
  color: rgb(146 64 14);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.dark :deep(.search-highlight) {
  background-color: rgb(146 64 14);
  color: rgb(254 240 138);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .search-modal-overlay {
    padding: 5vh 0.5rem 0.5rem;
  }

  .search-modal {
    max-width: none;
  }

  .search-shortcuts {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .result-content {
    width: 100%;
  }

  .result-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
