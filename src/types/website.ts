// 网站数据模型类型定义

export interface Website {
  id: string
  name: string
  url: string
  description?: string
  icon?: string
  categoryId?: string
  tags: string[]
  isPrivate: boolean
  isFavorite: boolean
  visitCount: number
  lastVisited?: Date
  createdAt: Date
  updatedAt: Date
  customFields?: Record<string, any>
}

export interface Category {
  id: string
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
  sortOrder: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  name: string
  color?: string
  description?: string
  usageCount: number
  createdAt: Date
}

export interface WebsiteStats {
  totalWebsites: number
  totalCategories: number
  totalTags: number
  favoriteCount: number
  privateCount: number
  mostVisitedWebsites: Website[]
  recentlyAdded: Website[]
  recentlyVisited: Website[]
}

// 创建网站的输入类型
export interface CreateWebsiteInput {
  name: string
  url: string
  description?: string
  categoryId?: string
  tags?: string[]
  isPrivate?: boolean
  isFavorite?: boolean
}

// 更新网站的输入类型
export interface UpdateWebsiteInput {
  name?: string
  url?: string
  description?: string
  categoryId?: string
  tags?: string[]
  isPrivate?: boolean
  isFavorite?: boolean
}

// 创建分类的输入类型
export interface CreateCategoryInput {
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
}

// 更新分类的输入类型
export interface UpdateCategoryInput {
  name?: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
  isVisible?: boolean
}

// 搜索过滤器
export interface WebsiteFilter {
  keyword?: string
  categoryId?: string
  tags?: string[]
  isFavorite?: boolean
  isPrivate?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

// 排序选项
export type SortField = 'name' | 'createdAt' | 'updatedAt' | 'visitCount' | 'lastVisited'
export type SortOrder = 'asc' | 'desc'

export interface SortOptions {
  field: SortField
  order: SortOrder
}

// 数据导入导出格式
export interface ExportData {
  version: string
  exportedAt: Date
  websites: Website[]
  categories: Category[]
  tags: Tag[]
  metadata?: Record<string, any>
}

// 数据验证错误
export interface ValidationError {
  field: string
  message: string
  code: string
}

// 数据迁移版本
export interface DataVersion {
  version: string
  description: string
  migratedAt?: Date
}

// 应用数据结构
export interface AppData {
  version: string
  websites: Website[]
  categories: Category[]
  tags: Tag[]
  settings: Record<string, any>
  lastBackup?: Date
  dataVersion: DataVersion
}
