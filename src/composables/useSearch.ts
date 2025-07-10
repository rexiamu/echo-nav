// 搜索功能组合式函数

import { ref, computed, watch } from 'vue'
import { useWebsiteStore } from '@/stores/websiteStore'
import {
  searchWebsites,
  generateSearchSuggestions,
  debounce,
  SearchHistory,
  type SearchResult,
} from '@/utils/searchUtils'
import type { Website } from '@/types/website'

/**
 * 搜索状态
 */
export interface SearchState {
  query: string
  results: SearchResult[]
  suggestions: string[]
  history: string[]
  isLoading: boolean
  isActive: boolean
  selectedIndex: number
}

/**
 * 搜索选项
 */
export interface UseSearchOptions {
  debounceMs?: number
  maxResults?: number
  maxSuggestions?: number
  threshold?: number
  enableHistory?: boolean
}

/**
 * 搜索功能
 */
export function useSearch(options: UseSearchOptions = {}) {
  const {
    debounceMs = 300,
    maxResults = 20,
    maxSuggestions = 5,
    threshold = 0.3,
    enableHistory = true,
  } = options

  // Store
  const websiteStore = useWebsiteStore()

  // 搜索历史管理
  const searchHistory = enableHistory ? new SearchHistory() : null

  // 状态
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const suggestions = ref<string[]>([])
  const history = ref<string[]>([])
  const isLoading = ref(false)
  const isActive = ref(false)
  const selectedIndex = ref(-1)

  // 计算属性
  const hasResults = computed(() => results.value.length > 0)
  const hasQuery = computed(() => query.value.trim().length > 0)
  const isEmpty = computed(() => !hasQuery.value && !hasResults.value)
  const totalResults = computed(() => results.value.length)

  /**
   * 执行搜索
   */
  const performSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      results.value = []
      suggestions.value = []
      return
    }

    isLoading.value = true

    try {
      // 搜索网站
      const searchResults = searchWebsites(
        websiteStore.websites.map(w => ({ ...w, tags: [...w.tags] })),
        searchQuery,
        {
          threshold,
          maxResults,
          includeScore: true,
          includeMatches: true,
          keys: ['name', 'url', 'description', 'tags'],
        }
      )

      results.value = searchResults

      // 生成搜索建议
      if (!hasResults.value) {
        suggestions.value = generateSearchSuggestions(
          websiteStore.websites.map(w => ({ ...w, tags: [...w.tags] })),
          searchQuery,
          maxSuggestions
        )
      } else {
        suggestions.value = []
      }

      // 重置选中索引
      selectedIndex.value = -1
    } catch (error) {
      console.error('搜索失败:', error)
      results.value = []
      suggestions.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 防抖搜索
  const debouncedSearch = debounce(performSearch, debounceMs)

  /**
   * 设置搜索查询
   */
  const setQuery = (newQuery: string) => {
    query.value = newQuery
    debouncedSearch(newQuery)
  }

  /**
   * 清空搜索
   */
  const clearSearch = () => {
    query.value = ''
    results.value = []
    suggestions.value = []
    selectedIndex.value = -1
    isLoading.value = false
  }

  /**
   * 激活搜索
   */
  const activateSearch = () => {
    isActive.value = true
    loadHistory()
  }

  /**
   * 关闭搜索
   */
  const deactivateSearch = () => {
    isActive.value = false
    clearSearch()
  }

  /**
   * 执行搜索并添加到历史
   */
  const executeSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query.value
    if (!finalQuery.trim()) return

    // 添加到搜索历史
    if (enableHistory && searchHistory) {
      searchHistory.addToHistory(finalQuery)
      loadHistory()
    }

    // 执行搜索
    performSearch(finalQuery)
  }

  /**
   * 选择搜索结果
   */
  const selectResult = (index: number) => {
    if (index >= 0 && index < results.value.length) {
      const result = results.value[index]
      const website = result.item

      // 访问网站
      websiteStore.visitWebsite(website.id)

      // 打开网站
      window.open(website.url, '_blank')

      // 关闭搜索
      deactivateSearch()
    }
  }

  /**
   * 选择建议
   */
  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    executeSearch(suggestion)
  }

  /**
   * 选择历史记录
   */
  const selectHistory = (historyItem: string) => {
    setQuery(historyItem)
    executeSearch(historyItem)
  }

  /**
   * 加载搜索历史
   */
  const loadHistory = () => {
    if (enableHistory && searchHistory) {
      history.value = searchHistory.getHistory()
    }
  }

  /**
   * 清除搜索历史
   */
  const clearHistory = () => {
    if (enableHistory && searchHistory) {
      searchHistory.clearHistory()
      history.value = []
    }
  }

  /**
   * 从历史中移除项目
   */
  const removeFromHistory = (item: string) => {
    if (enableHistory && searchHistory) {
      searchHistory.removeFromHistory(item)
      loadHistory()
    }
  }

  /**
   * 键盘导航
   */
  const navigateUp = () => {
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    } else if (selectedIndex.value === -1 && results.value.length > 0) {
      selectedIndex.value = results.value.length - 1
    }
  }

  const navigateDown = () => {
    if (selectedIndex.value < results.value.length - 1) {
      selectedIndex.value++
    } else if (selectedIndex.value === -1 && results.value.length > 0) {
      selectedIndex.value = 0
    }
  }

  const selectCurrent = () => {
    if (selectedIndex.value >= 0) {
      selectResult(selectedIndex.value)
    } else if (hasQuery.value) {
      executeSearch()
    }
  }

  /**
   * 获取分类后的结果
   */
  const getCategorizedResults = () => {
    const categorized = new Map<string, SearchResult[]>()

    for (const result of results.value) {
      const website = result.item
      const categoryName = website.categoryId
        ? websiteStore.getCategoryById(website.categoryId)?.name || '未分类'
        : '未分类'

      if (!categorized.has(categoryName)) {
        categorized.set(categoryName, [])
      }
      categorized.get(categoryName)!.push(result)
    }

    return categorized
  }

  /**
   * 获取热门搜索
   */
  const getPopularSearches = () => {
    // 基于网站访问次数生成热门搜索
    const popular = websiteStore.websites
      .filter(w => w.visitCount > 0)
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 5)
      .map(w => w.name)

    return popular
  }

  // 监听查询变化
  watch(query, newQuery => {
    if (newQuery.trim()) {
      debouncedSearch(newQuery)
    } else {
      clearSearch()
    }
  })

  // 初始化时加载历史
  if (enableHistory) {
    loadHistory()
  }

  return {
    // 状态
    query,
    results,
    suggestions,
    history,
    isLoading,
    isActive,
    selectedIndex,

    // 计算属性
    hasResults,
    hasQuery,
    isEmpty,
    totalResults,

    // 方法
    setQuery,
    clearSearch,
    activateSearch,
    deactivateSearch,
    executeSearch,
    selectResult,
    selectSuggestion,
    selectHistory,
    loadHistory,
    clearHistory,
    removeFromHistory,
    navigateUp,
    navigateDown,
    selectCurrent,
    getCategorizedResults,
    getPopularSearches,
  }
}
