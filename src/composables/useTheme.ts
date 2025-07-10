import { ref, computed, watch, onMounted, readonly } from 'vue'
import { useLocalStorage, usePreferredDark } from '@vueuse/core'
import type { Theme, ThemeConfig } from '@/types/ui'

// 主题状态
const theme = useLocalStorage<Theme>('echo-nav-theme', 'system')
const preferredDark = usePreferredDark()

// 计算当前是否为暗色主题
const isDark = computed(() => {
  if (theme.value === 'system') {
    return preferredDark.value
  }
  return theme.value === 'dark'
})

// 系统主题
const systemTheme = computed(() => {
  return preferredDark.value ? 'dark' : 'light'
})

// 主题配置
const themeConfig = computed<ThemeConfig>(() => ({
  theme: theme.value,
  systemTheme: systemTheme.value,
  isDark: isDark.value,
}))

/**
 * 主题管理组合式函数
 */
export function useTheme() {
  // 设置主题
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  // 切换主题
  const toggleTheme = () => {
    if (theme.value === 'light') {
      setTheme('dark')
    } else if (theme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  // 应用主题到DOM
  const applyTheme = () => {
    const html = document.documentElement

    if (isDark.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // 设置CSS变量
    html.style.setProperty('--theme', theme.value)
    html.style.setProperty('--is-dark', isDark.value ? '1' : '0')
  }

  // 获取主题显示名称
  const getThemeLabel = (themeValue?: Theme) => {
    const targetTheme = themeValue || theme.value
    switch (targetTheme) {
      case 'light':
        return '浅色'
      case 'dark':
        return '深色'
      case 'system':
        return '跟随系统'
      default:
        return '未知'
    }
  }

  // 获取主题图标
  const getThemeIcon = (themeValue?: Theme) => {
    const targetTheme = themeValue || theme.value
    switch (targetTheme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'system':
        return '💻'
      default:
        return '❓'
    }
  }

  // 监听主题变化
  watch(isDark, applyTheme, { immediate: true })

  // 组件挂载时应用主题
  onMounted(() => {
    applyTheme()
  })

  return {
    // 状态
    theme: readonly(theme),
    isDark: readonly(isDark),
    systemTheme: readonly(systemTheme),
    themeConfig: readonly(themeConfig),

    // 方法
    setTheme,
    toggleTheme,
    applyTheme,
    getThemeLabel,
    getThemeIcon,
  }
}

/**
 * 在应用挂载后初始化主题（不依赖Vue生命周期）
 */
export function applyThemeOnMount() {
  try {
    // 从localStorage获取保存的主题
    const savedTheme = localStorage.getItem('echo-nav-theme') as Theme
    const currentTheme = savedTheme || 'system'

    // 直接应用主题到DOM
    const isDarkMode =
      currentTheme === 'dark' ||
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    console.log('Theme applied on mount:', currentTheme, 'isDark:', isDarkMode)
  } catch (error) {
    console.warn('Failed to apply theme on mount:', error)
    // 默认应用浅色主题
    document.documentElement.classList.remove('dark')
  }
}

// 导出类型
export type { Theme, ThemeConfig }
