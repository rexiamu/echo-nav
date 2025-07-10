// 同步状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { githubAuth, type GitHubUser } from '@/services/githubAuth'
import { gistApi, type Gist } from '@/services/gistApi'
import { useWebsiteStore } from './websiteStore'
import {
  createSyncConfig,
  validateSyncConfig,
  detectSyncConflict,
  mergeConfigs,
  calculateConfigDiff,
  formatSyncTime,
  type SyncConfig,
  type SyncConflict,
  ConflictType,
} from '@/utils/syncUtils'

/**
 * 同步状态
 */
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  CONFLICT = 'conflict',
}

/**
 * 同步历史记录
 */
export interface SyncHistory {
  id: string
  timestamp: string
  status: SyncStatus
  message: string
  changes?: {
    websitesAdded: number
    websitesModified: number
    websitesDeleted: number
    categoriesAdded: number
    categoriesModified: number
    categoriesDeleted: number
    settingsChanged: boolean
  }
}

export const useSyncStore = defineStore('sync', () => {
  // 状态
  const isAuthenticated = ref(false)
  const user = ref<GitHubUser | null>(null)
  const status = ref<SyncStatus>(SyncStatus.IDLE)
  const lastSyncTime = ref<string | null>(null)
  const syncMessage = ref<string>('')
  const configGist = ref<Gist | null>(null)
  const autoSyncEnabled = ref(true)
  const syncInterval = ref(30) // 分钟
  const syncHistory = ref<SyncHistory[]>([])
  const pendingConflict = ref<SyncConflict | null>(null)

  // 计算属性
  const isSyncing = computed(() => status.value === SyncStatus.SYNCING)
  const hasError = computed(() => status.value === SyncStatus.ERROR)
  const hasConflict = computed(() => status.value === SyncStatus.CONFLICT)
  const lastSyncFormatted = computed(() =>
    lastSyncTime.value ? formatSyncTime(lastSyncTime.value) : '从未同步'
  )

  // 私有方法
  const websiteStore = useWebsiteStore()

  /**
   * 添加同步历史记录
   */
  const addSyncHistory = (
    status: SyncStatus,
    message: string,
    changes?: SyncHistory['changes']
  ) => {
    const historyItem: SyncHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status,
      message,
      changes,
    }

    syncHistory.value.unshift(historyItem)

    // 保留最近50条记录
    if (syncHistory.value.length > 50) {
      syncHistory.value = syncHistory.value.slice(0, 50)
    }

    // 保存到本地存储
    try {
      localStorage.setItem('echo-nav-sync-history', JSON.stringify(syncHistory.value))
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 加载同步历史
   */
  const loadSyncHistory = () => {
    try {
      const stored = localStorage.getItem('echo-nav-sync-history')
      if (stored) {
        syncHistory.value = JSON.parse(stored)
      }
    } catch {
      syncHistory.value = []
    }
  }

  /**
   * 初始化认证状态
   */
  const initAuth = async () => {
    try {
      if (githubAuth.isAuthenticated()) {
        const isValid = await githubAuth.isTokenValid()
        if (isValid) {
          isAuthenticated.value = true
          user.value = await githubAuth.getCurrentUser()

          // 查找配置Gist
          configGist.value = await gistApi.findConfigGist()
        } else {
          githubAuth.clearAuth()
          isAuthenticated.value = false
          user.value = null
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      isAuthenticated.value = false
      user.value = null
    }
  }

  /**
   * 使用Personal Access Token登录
   */
  const loginWithToken = async (token: string): Promise<void> => {
    try {
      status.value = SyncStatus.SYNCING
      syncMessage.value = '正在验证GitHub Token...'

      const authResult = await githubAuth.authenticateWithToken(token)
      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.message || '使用Token认证失败')
      }

      // 认证成功后初始化
      await initAuth()

      status.value = SyncStatus.SUCCESS
      syncMessage.value = '认证成功'

      addSyncHistory(
        SyncStatus.SUCCESS,
        `GitHub认证成功 - 用户: ${authResult.user.name || authResult.user.login}`
      )
    } catch (error) {
      status.value = SyncStatus.ERROR
      syncMessage.value = `认证失败: ${error instanceof Error ? error.message : '未知错误'}`

      addSyncHistory(SyncStatus.ERROR, `认证失败: ${syncMessage.value}`)
      throw error
    }
  }

  /**
   * 登出
   */
  const logout = () => {
    githubAuth.clearAuth()
    isAuthenticated.value = false
    user.value = null
    configGist.value = null
    status.value = SyncStatus.IDLE
    syncMessage.value = ''

    addSyncHistory(SyncStatus.SUCCESS, '已退出GitHub账户')
  }

  /**
   * 上传配置到GitHub
   */
  const uploadConfig = async (): Promise<void> => {
    if (!isAuthenticated.value) {
      throw new Error('未登录GitHub账户')
    }

    try {
      status.value = SyncStatus.SYNCING
      syncMessage.value = '正在上传配置...'

      // 创建同步配置
      const config = createSyncConfig(
        websiteStore.websites.map(w => ({ ...w, tags: [...w.tags] })),
        websiteStore.categories.map(c => ({ ...c })),
        {
          theme: 'system', // 从设置store获取
          cardSize: 'md',
          showDescriptions: true,
          showCategories: true,
        }
      )

      // 上传或更新Gist
      const gist = await gistApi.saveConfig(config, configGist.value?.id)
      configGist.value = gist

      lastSyncTime.value = new Date().toISOString()
      status.value = SyncStatus.SUCCESS
      syncMessage.value = '配置上传成功'

      addSyncHistory(SyncStatus.SUCCESS, '配置上传成功', {
        websitesAdded: websiteStore.websites.length,
        websitesModified: 0,
        websitesDeleted: 0,
        categoriesAdded: websiteStore.categories.length,
        categoriesModified: 0,
        categoriesDeleted: 0,
        settingsChanged: true,
      })
    } catch (error) {
      status.value = SyncStatus.ERROR
      syncMessage.value = `上传失败: ${error instanceof Error ? error.message : '未知错误'}`

      addSyncHistory(SyncStatus.ERROR, `上传失败: ${syncMessage.value}`)
      throw error
    }
  }

  /**
   * 从GitHub下载配置
   */
  const downloadConfig = async (): Promise<void> => {
    if (!isAuthenticated.value || !configGist.value) {
      throw new Error('未找到配置文件')
    }

    try {
      status.value = SyncStatus.SYNCING
      syncMessage.value = '正在下载配置...'

      // 下载配置
      const remoteConfig = await gistApi.loadConfig(configGist.value.id)

      if (!validateSyncConfig(remoteConfig)) {
        throw new Error('配置文件格式无效')
      }

      // 创建当前配置
      const localConfig = createSyncConfig(
        websiteStore.websites.map(w => ({ ...w, tags: [...w.tags] })),
        websiteStore.categories.map(c => ({ ...c })),
        {
          theme: 'system',
          cardSize: 'md',
          showDescriptions: true,
          showCategories: true,
        }
      )

      // 检测冲突
      const conflict = detectSyncConflict(localConfig, remoteConfig)

      if (conflict.type !== ConflictType.NO_CONFLICT && conflict.conflictFields.length > 0) {
        // 有冲突，需要用户选择
        pendingConflict.value = conflict
        status.value = SyncStatus.CONFLICT
        syncMessage.value = '检测到数据冲突，请选择解决方案'
        return
      }

      // 无冲突，直接应用
      await applyConfig(remoteConfig, localConfig)

      lastSyncTime.value = new Date().toISOString()
      status.value = SyncStatus.SUCCESS
      syncMessage.value = '配置下载成功'
    } catch (error) {
      status.value = SyncStatus.ERROR
      syncMessage.value = `下载失败: ${error instanceof Error ? error.message : '未知错误'}`

      addSyncHistory(SyncStatus.ERROR, `下载失败: ${syncMessage.value}`)
      throw error
    }
  }

  /**
   * 解决同步冲突
   */
  const resolveConflict = async (strategy: 'local' | 'remote' | 'merge'): Promise<void> => {
    if (!pendingConflict.value) {
      throw new Error('没有待解决的冲突')
    }

    try {
      status.value = SyncStatus.SYNCING
      syncMessage.value = '正在解决冲突...'

      const { localData, remoteData } = pendingConflict.value
      const mergedConfig = mergeConfigs(localData, remoteData, strategy)

      await applyConfig(mergedConfig, localData)

      // 上传合并后的配置
      if (strategy !== 'remote') {
        await gistApi.saveConfig(mergedConfig, configGist.value?.id)
      }

      pendingConflict.value = null
      lastSyncTime.value = new Date().toISOString()
      status.value = SyncStatus.SUCCESS
      syncMessage.value = '冲突解决成功'

      addSyncHistory(SyncStatus.SUCCESS, `冲突解决成功 (策略: ${strategy})`)
    } catch (error) {
      status.value = SyncStatus.ERROR
      syncMessage.value = `冲突解决失败: ${error instanceof Error ? error.message : '未知错误'}`

      addSyncHistory(SyncStatus.ERROR, `冲突解决失败: ${syncMessage.value}`)
      throw error
    }
  }

  /**
   * 应用配置到本地
   */
  const applyConfig = async (newConfig: SyncConfig, oldConfig: SyncConfig) => {
    // 计算变更
    const changes = calculateConfigDiff(oldConfig, newConfig)

    // 应用网站数据
    await websiteStore.replaceWebsites(newConfig.websites)

    // 应用分类数据
    await websiteStore.replaceCategories(newConfig.categories)

    // 应用设置（这里需要集成设置store）
    // TODO: 应用设置到设置store

    addSyncHistory(SyncStatus.SUCCESS, '配置应用成功', changes)
  }

  /**
   * 双向同步
   */
  const sync = async (): Promise<void> => {
    if (!isAuthenticated.value) {
      throw new Error('未登录GitHub账户')
    }

    try {
      // 如果没有配置Gist，直接上传
      if (!configGist.value) {
        await uploadConfig()
        return
      }

      // 先下载远程配置进行比较
      await downloadConfig()
    } catch (error) {
      throw error
    }
  }

  /**
   * 设置自动同步
   */
  const setAutoSync = (enabled: boolean, intervalMinutes?: number) => {
    autoSyncEnabled.value = enabled
    if (intervalMinutes) {
      syncInterval.value = intervalMinutes
    }

    // 保存设置
    try {
      localStorage.setItem(
        'echo-nav-auto-sync',
        JSON.stringify({
          enabled: autoSyncEnabled.value,
          interval: syncInterval.value,
        })
      )
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 加载自动同步设置
   */
  const loadAutoSyncSettings = () => {
    try {
      const stored = localStorage.getItem('echo-nav-auto-sync')
      if (stored) {
        const settings = JSON.parse(stored)
        autoSyncEnabled.value = settings.enabled ?? true
        syncInterval.value = settings.interval ?? 30
      }
    } catch {
      // 使用默认设置
    }
  }

  /**
   * 清除同步历史
   */
  const clearSyncHistory = () => {
    syncHistory.value = []
    try {
      localStorage.removeItem('echo-nav-sync-history')
    } catch {
      // 忽略存储错误
    }
  }

  // 初始化
  loadSyncHistory()
  loadAutoSyncSettings()

  return {
    // 状态
    isAuthenticated,
    user,
    status,
    lastSyncTime,
    syncMessage,
    configGist,
    autoSyncEnabled,
    syncInterval,
    syncHistory,
    pendingConflict,

    // 计算属性
    isSyncing,
    hasError,
    hasConflict,
    lastSyncFormatted,

    // 方法
    initAuth,
    loginWithToken,
    logout,
    uploadConfig,
    downloadConfig,
    sync,
    resolveConflict,
    setAutoSync,
    clearSyncHistory,
  }
})
