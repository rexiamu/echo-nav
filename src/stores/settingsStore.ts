import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { useLocalStorage, STORAGE_KEYS } from '@/composables/useLocalStorage'
import type { Theme } from '@/types/ui'

// 应用设置接口
export interface AppSettings {
  // 主题设置
  theme: Theme

  // 布局设置
  layout: {
    cardsPerRow: number
    cardSize: 'sm' | 'md' | 'lg'
    showDescriptions: boolean
    showIcons: boolean
    compactMode: boolean
  }

  // 搜索设置
  search: {
    enableFuzzySearch: boolean
    searchInDescription: boolean
    searchInTags: boolean
    maxResults: number
    showSearchHistory: boolean
  }

  // 隐私设置
  privacy: {
    showPrivateWebsites: boolean
    requirePasswordForPrivate: boolean
    hideVisitCounts: boolean
  }

  // 同步设置
  sync: {
    enableAutoSync: boolean
    syncInterval: number // 分钟
    lastSyncTime?: Date
    githubGistId?: string
  }

  // 导入导出设置
  backup: {
    enableAutoBackup: boolean
    backupInterval: number // 天
    maxBackups: number
    lastBackupTime?: Date
  }

  // 界面设置
  ui: {
    language: 'zh-CN' | 'en-US'
    showWelcomeMessage: boolean
    enableAnimations: boolean
    enableSounds: boolean
    showTooltips: boolean
  }

  // 高级设置
  advanced: {
    enableDebugMode: boolean
    enableExperimentalFeatures: boolean
    customCSS?: string
  }
}

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  layout: {
    cardsPerRow: 4,
    cardSize: 'md',
    showDescriptions: true,
    showIcons: true,
    compactMode: false,
  },
  search: {
    enableFuzzySearch: true,
    searchInDescription: true,
    searchInTags: true,
    maxResults: 50,
    showSearchHistory: true,
  },
  privacy: {
    showPrivateWebsites: true,
    requirePasswordForPrivate: false,
    hideVisitCounts: false,
  },
  sync: {
    enableAutoSync: false,
    syncInterval: 30,
  },
  backup: {
    enableAutoBackup: true,
    backupInterval: 7,
    maxBackups: 5,
  },
  ui: {
    language: 'zh-CN',
    showWelcomeMessage: true,
    enableAnimations: true,
    enableSounds: false,
    showTooltips: true,
  },
  advanced: {
    enableDebugMode: false,
    enableExperimentalFeatures: false,
  },
}

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const settings = ref<AppSettings>(DEFAULT_SETTINGS)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 本地存储
  const [storedSettings, setStoredSettings] = useLocalStorage(
    STORAGE_KEYS.SETTINGS,
    DEFAULT_SETTINGS
  )

  // 初始化设置
  function initializeSettings() {
    try {
      // 合并默认设置和存储的设置，确保新增的设置项有默认值
      settings.value = mergeSettings(DEFAULT_SETTINGS, storedSettings.value)
      saveSettings()
    } catch (err) {
      console.error('Failed to initialize settings:', err)
      settings.value = DEFAULT_SETTINGS
    }
  }

  // 合并设置对象
  function mergeSettings(base: AppSettings, updates: Partial<AppSettings>): AppSettings {
    const merged = { ...base }

    for (const key in updates) {
      const typedKey = key as keyof AppSettings
      if (Object.prototype.hasOwnProperty.call(updates, typedKey)) {
        const baseValue = base[typedKey]
        const updateValue = updates[typedKey]

        if (
          updateValue &&
          typeof updateValue === 'object' &&
          !Array.isArray(updateValue) &&
          baseValue &&
          typeof baseValue === 'object' &&
          !Array.isArray(baseValue)
        ) {
          ;(merged[typedKey] as any) = {
            ...(baseValue as object),
            ...(updateValue as object),
          }
        } else if (updateValue !== undefined) {
          ;(merged[typedKey] as any) = updateValue
        }
      }
    }

    return merged
  }

  // 保存设置
  function saveSettings() {
    try {
      setStoredSettings(settings.value)
    } catch (err) {
      console.error('Failed to save settings:', err)
      error.value = '保存设置失败'
    }
  }

  // 计算属性
  const currentTheme = computed(() => settings.value.theme)
  const layoutSettings = computed(() => settings.value.layout)
  const searchSettings = computed(() => settings.value.search)
  const privacySettings = computed(() => settings.value.privacy)
  const syncSettings = computed(() => settings.value.sync)
  const backupSettings = computed(() => settings.value.backup)
  const uiSettings = computed(() => settings.value.ui)
  const advancedSettings = computed(() => settings.value.advanced)

  // 更新设置的通用方法
  function updateSettings(updates: Partial<AppSettings>) {
    try {
      settings.value = mergeSettings(settings.value, updates)
      saveSettings()
    } catch (err) {
      console.error('Failed to update settings:', err)
      error.value = '更新设置失败'
    }
  }

  // 主题设置
  function setTheme(theme: Theme) {
    updateSettings({ theme })
  }

  // 布局设置
  function updateLayoutSettings(layoutUpdates: Partial<AppSettings['layout']>) {
    updateSettings({
      layout: { ...settings.value.layout, ...layoutUpdates },
    })
  }

  function setCardsPerRow(count: number) {
    if (count >= 1 && count <= 8) {
      updateLayoutSettings({ cardsPerRow: count })
    }
  }

  function setCardSize(size: 'sm' | 'md' | 'lg') {
    updateLayoutSettings({ cardSize: size })
  }

  function toggleCompactMode() {
    updateLayoutSettings({ compactMode: !settings.value.layout.compactMode })
  }

  function toggleDescriptions() {
    updateLayoutSettings({ showDescriptions: !settings.value.layout.showDescriptions })
  }

  function toggleIcons() {
    updateLayoutSettings({ showIcons: !settings.value.layout.showIcons })
  }

  // 搜索设置
  function updateSearchSettings(searchUpdates: Partial<AppSettings['search']>) {
    updateSettings({
      search: { ...settings.value.search, ...searchUpdates },
    })
  }

  function toggleFuzzySearch() {
    updateSearchSettings({ enableFuzzySearch: !settings.value.search.enableFuzzySearch })
  }

  function setMaxResults(count: number) {
    if (count >= 10 && count <= 200) {
      updateSearchSettings({ maxResults: count })
    }
  }

  // 隐私设置
  function updatePrivacySettings(privacyUpdates: Partial<AppSettings['privacy']>) {
    updateSettings({
      privacy: { ...settings.value.privacy, ...privacyUpdates },
    })
  }

  function togglePrivateWebsites() {
    updatePrivacySettings({ showPrivateWebsites: !settings.value.privacy.showPrivateWebsites })
  }

  function togglePasswordProtection() {
    updatePrivacySettings({
      requirePasswordForPrivate: !settings.value.privacy.requirePasswordForPrivate,
    })
  }

  // 同步设置
  function updateSyncSettings(syncUpdates: Partial<AppSettings['sync']>) {
    updateSettings({
      sync: { ...settings.value.sync, ...syncUpdates },
    })
  }

  function toggleAutoSync() {
    updateSyncSettings({ enableAutoSync: !settings.value.sync.enableAutoSync })
  }

  function setSyncInterval(minutes: number) {
    if (minutes >= 5 && minutes <= 1440) {
      // 5分钟到24小时
      updateSyncSettings({ syncInterval: minutes })
    }
  }

  function updateLastSyncTime() {
    updateSyncSettings({ lastSyncTime: new Date() })
  }

  // 备份设置
  function updateBackupSettings(backupUpdates: Partial<AppSettings['backup']>) {
    updateSettings({
      backup: { ...settings.value.backup, ...backupUpdates },
    })
  }

  function toggleAutoBackup() {
    updateBackupSettings({ enableAutoBackup: !settings.value.backup.enableAutoBackup })
  }

  function updateLastBackupTime() {
    updateBackupSettings({ lastBackupTime: new Date() })
  }

  // UI设置
  function updateUISettings(uiUpdates: Partial<AppSettings['ui']>) {
    updateSettings({
      ui: { ...settings.value.ui, ...uiUpdates },
    })
  }

  function setLanguage(language: 'zh-CN' | 'en-US') {
    updateUISettings({ language })
  }

  function toggleAnimations() {
    updateUISettings({ enableAnimations: !settings.value.ui.enableAnimations })
  }

  function toggleSounds() {
    updateUISettings({ enableSounds: !settings.value.ui.enableSounds })
  }

  function toggleTooltips() {
    updateUISettings({ showTooltips: !settings.value.ui.showTooltips })
  }

  // 高级设置
  function updateAdvancedSettings(advancedUpdates: Partial<AppSettings['advanced']>) {
    updateSettings({
      advanced: { ...settings.value.advanced, ...advancedUpdates },
    })
  }

  function toggleDebugMode() {
    updateAdvancedSettings({ enableDebugMode: !settings.value.advanced.enableDebugMode })
  }

  function toggleExperimentalFeatures() {
    updateAdvancedSettings({
      enableExperimentalFeatures: !settings.value.advanced.enableExperimentalFeatures,
    })
  }

  function setCustomCSS(css: string) {
    updateAdvancedSettings({ customCSS: css })
  }

  // 重置设置
  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    saveSettings()
  }

  function resetSection(section: keyof AppSettings) {
    updateSettings({
      [section]: DEFAULT_SETTINGS[section],
    })
  }

  // 导出设置
  function exportSettings() {
    return {
      version: '1.0.0',
      exportedAt: new Date(),
      settings: settings.value,
    }
  }

  // 导入设置
  function importSettings(importedSettings: Partial<AppSettings>) {
    try {
      const merged = mergeSettings(DEFAULT_SETTINGS, importedSettings)
      settings.value = merged
      saveSettings()
    } catch (err) {
      console.error('Failed to import settings:', err)
      error.value = '导入设置失败'
      throw err
    }
  }

  return {
    // 状态
    settings: readonly(settings),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 计算属性
    currentTheme,
    layoutSettings,
    searchSettings,
    privacySettings,
    syncSettings,
    backupSettings,
    uiSettings,
    advancedSettings,

    // 方法
    initializeSettings,
    updateSettings,
    saveSettings,

    // 主题
    setTheme,

    // 布局
    updateLayoutSettings,
    setCardsPerRow,
    setCardSize,
    toggleCompactMode,
    toggleDescriptions,
    toggleIcons,

    // 搜索
    updateSearchSettings,
    toggleFuzzySearch,
    setMaxResults,

    // 隐私
    updatePrivacySettings,
    togglePrivateWebsites,
    togglePasswordProtection,

    // 同步
    updateSyncSettings,
    toggleAutoSync,
    setSyncInterval,
    updateLastSyncTime,

    // 备份
    updateBackupSettings,
    toggleAutoBackup,
    updateLastBackupTime,

    // UI
    updateUISettings,
    setLanguage,
    toggleAnimations,
    toggleSounds,
    toggleTooltips,

    // 高级
    updateAdvancedSettings,
    toggleDebugMode,
    toggleExperimentalFeatures,
    setCustomCSS,

    // 重置和导入导出
    resetSettings,
    resetSection,
    exportSettings,
    importSettings,
  }
})
