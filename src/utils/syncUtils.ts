// 同步工具函数

import type { Website, Category } from '@/types/website'

/**
 * 同步配置数据结构
 */
export interface SyncConfig {
  websites: Website[]
  categories: Category[]
  settings: {
    theme: string
    cardSize: string
    showDescriptions: boolean
    showCategories: boolean
  }
  metadata: {
    version: string
    lastSync: string
    deviceId: string
    appVersion: string
  }
}

/**
 * 同步冲突类型
 */
export enum ConflictType {
  LOCAL_NEWER = 'local_newer',
  REMOTE_NEWER = 'remote_newer',
  BOTH_MODIFIED = 'both_modified',
  NO_CONFLICT = 'no_conflict',
}

/**
 * 同步冲突信息
 */
export interface SyncConflict {
  type: ConflictType
  localData: SyncConfig
  remoteData: SyncConfig
  conflictFields: string[]
}

/**
 * 生成设备ID
 */
export function generateDeviceId(): string {
  const stored = localStorage.getItem('echo-nav-device-id')
  if (stored) return stored

  const deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + 
                   Date.now().toString(36)
  
  try {
    localStorage.setItem('echo-nav-device-id', deviceId)
  } catch {
    // 忽略存储错误
  }

  return deviceId
}

/**
 * 获取当前应用版本
 */
export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0'
}

/**
 * 创建同步配置
 */
export function createSyncConfig(
  websites: Website[],
  categories: Category[],
  settings: any
): SyncConfig {
  return {
    websites: websites.map(website => ({
      ...website,
      // 移除可能包含敏感信息的字段
      id: website.id,
      name: website.name,
      url: website.url,
      description: website.description,
      categoryId: website.categoryId,
      tags: website.tags,
      isFavorite: website.isFavorite,
      isPrivate: website.isPrivate,
      visitCount: website.visitCount,
      lastVisited: website.lastVisited,
      createdAt: website.createdAt,
      updatedAt: website.updatedAt,
    })),
    categories: categories.map(category => ({
      ...category,
      id: category.id,
      name: category.name,
      icon: category.icon,
      description: category.description,
      color: category.color,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    })),
    settings: {
      theme: settings.theme || 'system',
      cardSize: settings.cardSize || 'md',
      showDescriptions: settings.showDescriptions ?? true,
      showCategories: settings.showCategories ?? true,
    },
    metadata: {
      version: '1.0',
      lastSync: new Date().toISOString(),
      deviceId: generateDeviceId(),
      appVersion: getAppVersion(),
    },
  }
}

/**
 * 验证同步配置格式
 */
export function validateSyncConfig(config: any): config is SyncConfig {
  if (!config || typeof config !== 'object') return false

  // 检查必需字段
  if (!Array.isArray(config.websites)) return false
  if (!Array.isArray(config.categories)) return false
  if (!config.settings || typeof config.settings !== 'object') return false
  if (!config.metadata || typeof config.metadata !== 'object') return false

  // 检查网站数据结构
  for (const website of config.websites) {
    if (!website.id || !website.name || !website.url) return false
  }

  // 检查分类数据结构
  for (const category of config.categories) {
    if (!category.id || !category.name) return false
  }

  // 检查元数据
  if (!config.metadata.version || !config.metadata.lastSync) return false

  return true
}

/**
 * 比较两个配置的时间戳
 */
export function compareConfigTimestamps(
  localConfig: SyncConfig,
  remoteConfig: SyncConfig
): ConflictType {
  const localTime = new Date(localConfig.metadata.lastSync).getTime()
  const remoteTime = new Date(remoteConfig.metadata.lastSync).getTime()

  const timeDiff = Math.abs(localTime - remoteTime)
  const threshold = 5000 // 5秒阈值，避免时钟偏差导致的误判

  if (timeDiff <= threshold) {
    return ConflictType.NO_CONFLICT
  }

  if (localTime > remoteTime) {
    return ConflictType.LOCAL_NEWER
  } else {
    return ConflictType.REMOTE_NEWER
  }
}

/**
 * 检测同步冲突
 */
export function detectSyncConflict(
  localConfig: SyncConfig,
  remoteConfig: SyncConfig
): SyncConflict {
  const conflictType = compareConfigTimestamps(localConfig, remoteConfig)
  const conflictFields: string[] = []

  // 检查具体字段的冲突
  if (JSON.stringify(localConfig.websites) !== JSON.stringify(remoteConfig.websites)) {
    conflictFields.push('websites')
  }

  if (JSON.stringify(localConfig.categories) !== JSON.stringify(remoteConfig.categories)) {
    conflictFields.push('categories')
  }

  if (JSON.stringify(localConfig.settings) !== JSON.stringify(remoteConfig.settings)) {
    conflictFields.push('settings')
  }

  return {
    type: conflictFields.length > 0 ? conflictType : ConflictType.NO_CONFLICT,
    localData: localConfig,
    remoteData: remoteConfig,
    conflictFields,
  }
}

/**
 * 合并配置（智能合并策略）
 */
export function mergeConfigs(
  localConfig: SyncConfig,
  remoteConfig: SyncConfig,
  strategy: 'local' | 'remote' | 'merge' = 'merge'
): SyncConfig {
  if (strategy === 'local') {
    return {
      ...localConfig,
      metadata: {
        ...localConfig.metadata,
        lastSync: new Date().toISOString(),
      },
    }
  }

  if (strategy === 'remote') {
    return {
      ...remoteConfig,
      metadata: {
        ...remoteConfig.metadata,
        lastSync: new Date().toISOString(),
        deviceId: generateDeviceId(),
      },
    }
  }

  // 智能合并策略
  const mergedWebsites = mergeWebsites(localConfig.websites, remoteConfig.websites)
  const mergedCategories = mergeCategories(localConfig.categories, remoteConfig.categories)
  const mergedSettings = { ...remoteConfig.settings, ...localConfig.settings }

  return {
    websites: mergedWebsites,
    categories: mergedCategories,
    settings: mergedSettings,
    metadata: {
      version: localConfig.metadata.version,
      lastSync: new Date().toISOString(),
      deviceId: generateDeviceId(),
      appVersion: getAppVersion(),
    },
  }
}

/**
 * 合并网站数据
 */
function mergeWebsites(localWebsites: Website[], remoteWebsites: Website[]): Website[] {
  const merged = new Map<string, Website>()

  // 添加远程网站
  for (const website of remoteWebsites) {
    merged.set(website.id, website)
  }

  // 合并本地网站（本地优先）
  for (const website of localWebsites) {
    const existing = merged.get(website.id)
    if (!existing) {
      merged.set(website.id, website)
    } else {
      // 比较更新时间，选择较新的
      const localTime = new Date(website.updatedAt || website.createdAt).getTime()
      const remoteTime = new Date(existing.updatedAt || existing.createdAt).getTime()
      
      if (localTime >= remoteTime) {
        merged.set(website.id, website)
      }
    }
  }

  return Array.from(merged.values())
}

/**
 * 合并分类数据
 */
function mergeCategories(localCategories: Category[], remoteCategories: Category[]): Category[] {
  const merged = new Map<string, Category>()

  // 添加远程分类
  for (const category of remoteCategories) {
    merged.set(category.id, category)
  }

  // 合并本地分类（本地优先）
  for (const category of localCategories) {
    const existing = merged.get(category.id)
    if (!existing) {
      merged.set(category.id, category)
    } else {
      // 比较更新时间，选择较新的
      const localTime = new Date(category.updatedAt || category.createdAt).getTime()
      const remoteTime = new Date(existing.updatedAt || existing.createdAt).getTime()
      
      if (localTime >= remoteTime) {
        merged.set(category.id, category)
      }
    }
  }

  return Array.from(merged.values())
}

/**
 * 计算配置差异
 */
export function calculateConfigDiff(
  oldConfig: SyncConfig,
  newConfig: SyncConfig
): {
  websitesAdded: number
  websitesModified: number
  websitesDeleted: number
  categoriesAdded: number
  categoriesModified: number
  categoriesDeleted: number
  settingsChanged: boolean
} {
  const oldWebsiteIds = new Set(oldConfig.websites.map(w => w.id))
  const newWebsiteIds = new Set(newConfig.websites.map(w => w.id))
  
  const oldCategoryIds = new Set(oldConfig.categories.map(c => c.id))
  const newCategoryIds = new Set(newConfig.categories.map(c => c.id))

  const websitesAdded = newConfig.websites.filter(w => !oldWebsiteIds.has(w.id)).length
  const websitesDeleted = oldConfig.websites.filter(w => !newWebsiteIds.has(w.id)).length
  
  const websitesModified = newConfig.websites.filter(newWebsite => {
    const oldWebsite = oldConfig.websites.find(w => w.id === newWebsite.id)
    return oldWebsite && JSON.stringify(oldWebsite) !== JSON.stringify(newWebsite)
  }).length

  const categoriesAdded = newConfig.categories.filter(c => !oldCategoryIds.has(c.id)).length
  const categoriesDeleted = oldConfig.categories.filter(c => !newCategoryIds.has(c.id)).length
  
  const categoriesModified = newConfig.categories.filter(newCategory => {
    const oldCategory = oldConfig.categories.find(c => c.id === newCategory.id)
    return oldCategory && JSON.stringify(oldCategory) !== JSON.stringify(newCategory)
  }).length

  const settingsChanged = JSON.stringify(oldConfig.settings) !== JSON.stringify(newConfig.settings)

  return {
    websitesAdded,
    websitesModified,
    websitesDeleted,
    categoriesAdded,
    categoriesModified,
    categoriesDeleted,
    settingsChanged,
  }
}

/**
 * 格式化同步时间
 */
export function formatSyncTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN')
}
