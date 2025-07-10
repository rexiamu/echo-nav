import { ref, watch } from 'vue'
import type { Ref } from 'vue'

// 本地存储键名常量
export const STORAGE_KEYS = {
  WEBSITES: 'echo-nav-websites',
  CATEGORIES: 'echo-nav-categories',
  TAGS: 'echo-nav-tags',
  SETTINGS: 'echo-nav-settings',
  APP_DATA: 'echo-nav-app-data',
  DATA_VERSION: 'echo-nav-data-version',
  LAST_BACKUP: 'echo-nav-last-backup',
} as const

// 本地存储错误类型
export class LocalStorageError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message)
    this.name = 'LocalStorageError'
  }
}

/**
 * 检查本地存储是否可用
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, 'test')
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * 安全地从本地存储获取数据
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    console.warn('LocalStorage is not available, using default value')
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    if (item === null) {
      return defaultValue
    }
    return JSON.parse(item)
  } catch (error) {
    console.error(`Failed to parse localStorage item "${key}":`, error)
    return defaultValue
  }
}

/**
 * 安全地设置本地存储数据
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('LocalStorage is not available, cannot save data')
    return false
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Failed to save to localStorage "${key}":`, error)
    throw new LocalStorageError(
      `Failed to save data to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'STORAGE_WRITE_ERROR'
    )
  }
}

/**
 * 删除本地存储项
 */
export function removeStorageItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Failed to remove localStorage item "${key}":`, error)
    return false
  }
}

/**
 * 清空所有应用相关的本地存储
 */
export function clearAppStorage(): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    return true
  } catch (error) {
    console.error('Failed to clear app storage:', error)
    return false
  }
}

/**
 * 响应式本地存储组合式函数
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options: {
    serializer?: {
      read: (value: string) => T
      write: (value: T) => string
    }
    syncAcrossTabs?: boolean
  } = {}
): [Ref<T>, (value: T) => void, () => void] {
  const {
    serializer = {
      read: JSON.parse,
      write: JSON.stringify,
    },
    syncAcrossTabs = true,
  } = options

  // 初始化响应式引用
  const storedValue = ref(getStorageItem(key, defaultValue)) as Ref<T>

  // 设置值的函数
  const setValue = (value: T) => {
    try {
      storedValue.value = value
      if (isLocalStorageAvailable()) {
        localStorage.setItem(key, serializer.write(value))
      }
    } catch (error) {
      console.error(`Failed to set localStorage value for "${key}":`, error)
    }
  }

  // 删除值的函数
  const removeValue = () => {
    try {
      storedValue.value = defaultValue
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Failed to remove localStorage value for "${key}":`, error)
    }
  }

  // 监听值的变化并自动保存
  watch(
    storedValue,
    newValue => {
      if (isLocalStorageAvailable()) {
        try {
          localStorage.setItem(key, serializer.write(newValue))
        } catch (error) {
          console.error(`Failed to sync localStorage for "${key}":`, error)
        }
      }
    },
    { deep: true }
  )

  // 跨标签页同步
  if (syncAcrossTabs && typeof window !== 'undefined') {
    window.addEventListener('storage', e => {
      if (e.key === key && e.newValue !== null) {
        try {
          storedValue.value = serializer.read(e.newValue)
        } catch (error) {
          console.error(`Failed to sync across tabs for "${key}":`, error)
        }
      }
    })
  }

  return [storedValue, setValue, removeValue]
}

/**
 * 获取本地存储使用情况
 */
export function getStorageUsage(): {
  used: number
  total: number
  percentage: number
  items: Array<{ key: string; size: number }>
} {
  if (!isLocalStorageAvailable()) {
    return { used: 0, total: 0, percentage: 0, items: [] }
  }

  let used = 0
  const items: Array<{ key: string; size: number }> = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key) || ''
      const size = new Blob([value]).size
      used += size
      items.push({ key, size })
    }
  }

  // 大多数浏览器的localStorage限制是5MB
  const total = 5 * 1024 * 1024
  const percentage = (used / total) * 100

  return { used, total, percentage, items }
}
