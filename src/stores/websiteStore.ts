import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  Website,
  Category,
  Tag,
  CreateWebsiteInput,
  UpdateWebsiteInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  WebsiteFilter,
  SortOptions,
  WebsiteStats,
  ExportData,
} from '@/types/website'
import {
  validateCreateWebsiteInput,
  validateUpdateWebsiteInput,
  validateCreateCategoryInput,
  validateUpdateCategoryInput,
  sanitizeWebsiteData,
} from '@/utils/dataValidation'
import { useLocalStorage, STORAGE_KEYS } from '@/composables/useLocalStorage'

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 默认数据
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: '常用工具',
    description: '日常工作和学习中常用的工具网站',
    color: '#3B82F6',
    icon: '🔧',
    sortOrder: 1,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-2',
    name: '学习资源',
    description: '编程学习和技术文档相关网站',
    color: '#10B981',
    icon: '📚',
    sortOrder: 2,
    isVisible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const DEFAULT_WEBSITES: Website[] = [
  {
    id: 'web-1',
    name: 'GitHub',
    url: 'https://github.com',
    description: '全球最大的代码托管平台',
    icon: 'https://github.com/favicon.ico',
    categoryId: 'cat-1',
    tags: ['开发', '代码', '开源'],
    isPrivate: false,
    isFavorite: true,
    visitCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'web-2',
    name: 'Vue.js',
    url: 'https://vuejs.org',
    description: '渐进式JavaScript框架',
    icon: 'https://vuejs.org/favicon.ico',
    categoryId: 'cat-2',
    tags: ['Vue', '前端', '框架'],
    isPrivate: false,
    isFavorite: true,
    visitCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const useWebsiteStore = defineStore('website', () => {
  // 状态
  const websites = ref<Website[]>([])
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 本地存储
  const [storedWebsites, setStoredWebsites] = useLocalStorage(
    STORAGE_KEYS.WEBSITES,
    DEFAULT_WEBSITES
  )
  const [storedCategories, setStoredCategories] = useLocalStorage(
    STORAGE_KEYS.CATEGORIES,
    DEFAULT_CATEGORIES
  )
  const [storedTags, setStoredTags] = useLocalStorage(STORAGE_KEYS.TAGS, [] as Tag[])

  // 初始化数据
  function initializeData() {
    websites.value = storedWebsites.value
    categories.value = storedCategories.value
    tags.value = storedTags.value
    updateTagsFromWebsites()
  }

  // 保存数据到本地存储
  function saveToStorage() {
    setStoredWebsites(websites.value)
    setStoredCategories(categories.value)
    setStoredTags(tags.value)
  }

  // 计算属性
  const websiteCount = computed(() => websites.value.length)
  const categoryCount = computed(() => categories.value.length)
  const tagCount = computed(() => tags.value.length)
  const favoriteWebsites = computed(() => websites.value.filter(w => w.isFavorite))
  const privateWebsites = computed(() => websites.value.filter(w => w.isPrivate))

  // 获取网站统计信息
  const stats = computed((): WebsiteStats => {
    const sortedByVisits = [...websites.value].sort((a, b) => b.visitCount - a.visitCount)
    const sortedByCreated = [...websites.value].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )
    const sortedByVisited = [...websites.value]
      .filter(w => w.lastVisited)
      .sort((a, b) => (b.lastVisited?.getTime() || 0) - (a.lastVisited?.getTime() || 0))

    return {
      totalWebsites: websiteCount.value,
      totalCategories: categoryCount.value,
      totalTags: tagCount.value,
      favoriteCount: favoriteWebsites.value.length,
      privateCount: privateWebsites.value.length,
      mostVisitedWebsites: sortedByVisits.slice(0, 10),
      recentlyAdded: sortedByCreated.slice(0, 10),
      recentlyVisited: sortedByVisited.slice(0, 10),
    }
  })

  // 网站操作
  async function createWebsite(input: CreateWebsiteInput): Promise<Website> {
    const validation = validateCreateWebsiteInput(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    const sanitized = sanitizeWebsiteData(input)
    const now = new Date()
    const website: Website = {
      id: generateId(),
      name: sanitized.name!,
      url: sanitized.url!,
      description: sanitized.description || '',
      categoryId: sanitized.categoryId,
      tags: sanitized.tags || [],
      isPrivate: sanitized.isPrivate || false,
      isFavorite: sanitized.isFavorite || false,
      visitCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    websites.value.push(website)
    updateTagsFromWebsites()
    saveToStorage()
    return website
  }

  async function updateWebsite(id: string, input: UpdateWebsiteInput): Promise<Website> {
    const validation = validateUpdateWebsiteInput(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    const index = websites.value.findIndex(w => w.id === id)
    if (index === -1) {
      throw new Error('网站不存在')
    }

    const sanitized = sanitizeWebsiteData(input)
    const website = websites.value[index]

    Object.assign(website, {
      ...sanitized,
      updatedAt: new Date(),
    })

    updateTagsFromWebsites()
    saveToStorage()
    return website
  }

  async function deleteWebsite(id: string): Promise<void> {
    const index = websites.value.findIndex(w => w.id === id)
    if (index === -1) {
      throw new Error('网站不存在')
    }

    websites.value.splice(index, 1)
    updateTagsFromWebsites()
    saveToStorage()
  }

  function getWebsiteById(id: string): Website | undefined {
    return websites.value.find(w => w.id === id)
  }

  // 分类操作
  async function createCategory(input: CreateCategoryInput): Promise<Category> {
    const validation = validateCreateCategoryInput(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    const now = new Date()
    const category: Category = {
      id: generateId(),
      name: input.name.trim(),
      description: input.description?.trim(),
      color: input.color,
      icon: input.icon,
      parentId: input.parentId,
      sortOrder: categories.value.length + 1,
      isVisible: true,
      createdAt: now,
      updatedAt: now,
    }

    categories.value.push(category)
    saveToStorage()
    return category
  }

  async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const validation = validateUpdateCategoryInput(input)
    if (!validation.isValid) {
      throw new Error(`验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    const index = categories.value.findIndex(c => c.id === id)
    if (index === -1) {
      throw new Error('分类不存在')
    }

    const category = categories.value[index]
    Object.assign(category, {
      ...input,
      updatedAt: new Date(),
    })

    saveToStorage()
    return category
  }

  async function deleteCategory(id: string): Promise<void> {
    const index = categories.value.findIndex(c => c.id === id)
    if (index === -1) {
      throw new Error('分类不存在')
    }

    // 将该分类下的网站移到未分类
    websites.value.forEach(website => {
      if (website.categoryId === id) {
        website.categoryId = undefined
        website.updatedAt = new Date()
      }
    })

    categories.value.splice(index, 1)
    saveToStorage()
  }

  function getCategoryById(id: string): Category | undefined {
    return categories.value.find(c => c.id === id)
  }

  // 标签操作
  function updateTagsFromWebsites() {
    const tagMap = new Map<string, Tag>()

    // 统计标签使用次数
    websites.value.forEach(website => {
      website.tags.forEach(tagName => {
        const existing = tagMap.get(tagName)
        if (existing) {
          existing.usageCount++
        } else {
          tagMap.set(tagName, {
            id: generateId(),
            name: tagName,
            usageCount: 1,
            createdAt: new Date(),
          })
        }
      })
    })

    tags.value = Array.from(tagMap.values()).sort((a, b) => b.usageCount - a.usageCount)
  }

  // 访问网站
  function visitWebsite(id: string) {
    const website = getWebsiteById(id)
    if (website) {
      website.visitCount++
      website.lastVisited = new Date()
      website.updatedAt = new Date()
      saveToStorage()
    }
  }

  // 切换收藏状态
  function toggleFavorite(id: string) {
    const website = getWebsiteById(id)
    if (website) {
      website.isFavorite = !website.isFavorite
      website.updatedAt = new Date()
      saveToStorage()
    }
  }

  // 数据导出
  function exportData(): ExportData {
    return {
      version: '1.0.0',
      exportedAt: new Date(),
      websites: websites.value,
      categories: categories.value,
      tags: tags.value,
      metadata: {
        totalWebsites: websiteCount.value,
        totalCategories: categoryCount.value,
        totalTags: tagCount.value,
      },
    }
  }

  // 数据导入
  async function importData(data: ExportData): Promise<void> {
    try {
      isLoading.value = true
      error.value = null

      // 这里可以添加数据验证和迁移逻辑
      websites.value = data.websites || []
      categories.value = data.categories || []
      tags.value = data.tags || []

      updateTagsFromWebsites()
      saveToStorage()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导入数据失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 清空所有数据
  function clearAllData() {
    websites.value = []
    categories.value = []
    tags.value = []
    saveToStorage()
  }

  // 批量替换
  async function replaceWebsites(newWebsites: Website[]): Promise<void> {
    websites.value = newWebsites
    updateTagsFromWebsites()
    saveToStorage()
  }

  async function replaceCategories(newCategories: Category[]): Promise<void> {
    categories.value = newCategories
    saveToStorage()
  }

  return {
    // 状态
    websites: readonly(websites),
    categories: readonly(categories),
    tags: readonly(tags),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 计算属性
    websiteCount,
    categoryCount,
    tagCount,
    favoriteWebsites,
    privateWebsites,
    stats,

    // 方法
    initializeData,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    getWebsiteById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    visitWebsite,
    toggleFavorite,
    exportData,
    importData,
    clearAllData,
    replaceWebsites,
    replaceCategories,
  }
})
