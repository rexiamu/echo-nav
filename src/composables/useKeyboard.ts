// 键盘事件管理

import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 键盘快捷键配置
 */
export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  preventDefault?: boolean
  handler: (event: KeyboardEvent) => void
}

/**
 * 键盘导航方向
 */
export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'home' | 'end'

/**
 * 键盘事件管理
 */
export function useKeyboard() {
  const shortcuts = ref<Map<string, KeyboardShortcut>>(new Map())
  const isListening = ref(false)

  /**
   * 生成快捷键标识符
   */
  const generateShortcutId = (shortcut: KeyboardShortcut): string => {
    const parts = []
    if (shortcut.ctrl) parts.push('ctrl')
    if (shortcut.meta) parts.push('meta')
    if (shortcut.shift) parts.push('shift')
    if (shortcut.alt) parts.push('alt')
    parts.push(shortcut.key.toLowerCase())
    return parts.join('+')
  }

  /**
   * 检查事件是否匹配快捷键
   */
  const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey
    const meta = event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey

    return (
      key === shortcut.key.toLowerCase() &&
      !!ctrl === !!shortcut.ctrl &&
      !!meta === !!shortcut.meta &&
      !!shift === !!shortcut.shift &&
      !!alt === !!shortcut.alt
    )
  }

  /**
   * 键盘事件处理器
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    for (const shortcut of shortcuts.value.values()) {
      if (matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault) {
          event.preventDefault()
        }
        shortcut.handler(event)
        break
      }
    }
  }

  /**
   * 注册快捷键
   */
  const registerShortcut = (shortcut: KeyboardShortcut) => {
    const id = generateShortcutId(shortcut)
    shortcuts.value.set(id, shortcut)
  }

  /**
   * 注销快捷键
   */
  const unregisterShortcut = (shortcut: KeyboardShortcut) => {
    const id = generateShortcutId(shortcut)
    shortcuts.value.delete(id)
  }

  /**
   * 清除所有快捷键
   */
  const clearShortcuts = () => {
    shortcuts.value.clear()
  }

  /**
   * 开始监听键盘事件
   */
  const startListening = () => {
    if (!isListening.value) {
      document.addEventListener('keydown', handleKeyDown)
      isListening.value = true
    }
  }

  /**
   * 停止监听键盘事件
   */
  const stopListening = () => {
    if (isListening.value) {
      document.removeEventListener('keydown', handleKeyDown)
      isListening.value = false
    }
  }

  // 组件挂载时开始监听
  onMounted(() => {
    startListening()
  })

  // 组件卸载时停止监听
  onUnmounted(() => {
    stopListening()
  })

  return {
    registerShortcut,
    unregisterShortcut,
    clearShortcuts,
    startListening,
    stopListening,
    isListening,
  }
}

/**
 * 搜索快捷键管理
 */
export function useSearchShortcuts() {
  const { registerShortcut, unregisterShortcut } = useKeyboard()

  /**
   * 注册搜索相关快捷键
   */
  const registerSearchShortcuts = (callbacks: {
    onOpenSearch?: () => void
    onCloseSearch?: () => void
  }) => {
    // Ctrl/Cmd + K 打开搜索
    if (callbacks.onOpenSearch) {
      registerShortcut({
        key: 'k',
        ctrl: true,
        preventDefault: true,
        handler: callbacks.onOpenSearch,
      })

      // Mac 用户习惯使用 Cmd + K
      registerShortcut({
        key: 'k',
        meta: true,
        preventDefault: true,
        handler: callbacks.onOpenSearch,
      })
    }

    // ESC 关闭搜索
    if (callbacks.onCloseSearch) {
      registerShortcut({
        key: 'Escape',
        preventDefault: true,
        handler: callbacks.onCloseSearch,
      })
    }
  }

  /**
   * 注销搜索快捷键
   */
  const unregisterSearchShortcuts = () => {
    unregisterShortcut({ key: 'k', ctrl: true, preventDefault: true, handler: () => {} })
    unregisterShortcut({ key: 'k', meta: true, preventDefault: true, handler: () => {} })
    unregisterShortcut({ key: 'Escape', preventDefault: true, handler: () => {} })
  }

  return {
    registerSearchShortcuts,
    unregisterSearchShortcuts,
  }
}

/**
 * 列表导航快捷键
 */
export function useListNavigation() {
  const currentIndex = ref(-1)
  const maxIndex = ref(0)

  /**
   * 重置导航状态
   */
  const resetNavigation = () => {
    currentIndex.value = -1
  }

  /**
   * 设置最大索引
   */
  const setMaxIndex = (max: number) => {
    maxIndex.value = max
  }

  /**
   * 导航到指定索引
   */
  const navigateToIndex = (index: number) => {
    if (index >= 0 && index < maxIndex.value) {
      currentIndex.value = index
    }
  }

  /**
   * 向上导航
   */
  const navigateUp = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--
    } else if (currentIndex.value === -1 && maxIndex.value > 0) {
      currentIndex.value = maxIndex.value - 1
    }
  }

  /**
   * 向下导航
   */
  const navigateDown = () => {
    if (currentIndex.value < maxIndex.value - 1) {
      currentIndex.value++
    } else if (currentIndex.value === -1 && maxIndex.value > 0) {
      currentIndex.value = 0
    }
  }

  /**
   * 导航到第一项
   */
  const navigateToFirst = () => {
    if (maxIndex.value > 0) {
      currentIndex.value = 0
    }
  }

  /**
   * 导航到最后一项
   */
  const navigateToLast = () => {
    if (maxIndex.value > 0) {
      currentIndex.value = maxIndex.value - 1
    }
  }

  /**
   * 注册列表导航快捷键
   */
  const registerListNavigation = (callbacks: {
    onNavigate?: (index: number) => void
    onSelect?: (index: number) => void
  }) => {
    const { registerShortcut } = useKeyboard()

    // 上箭头
    registerShortcut({
      key: 'ArrowUp',
      preventDefault: true,
      handler: () => {
        navigateUp()
        callbacks.onNavigate?.(currentIndex.value)
      },
    })

    // 下箭头
    registerShortcut({
      key: 'ArrowDown',
      preventDefault: true,
      handler: () => {
        navigateDown()
        callbacks.onNavigate?.(currentIndex.value)
      },
    })

    // Home 键
    registerShortcut({
      key: 'Home',
      preventDefault: true,
      handler: () => {
        navigateToFirst()
        callbacks.onNavigate?.(currentIndex.value)
      },
    })

    // End 键
    registerShortcut({
      key: 'End',
      preventDefault: true,
      handler: () => {
        navigateToLast()
        callbacks.onNavigate?.(currentIndex.value)
      },
    })

    // Enter 键选择
    registerShortcut({
      key: 'Enter',
      preventDefault: true,
      handler: () => {
        if (currentIndex.value >= 0) {
          callbacks.onSelect?.(currentIndex.value)
        }
      },
    })
  }

  return {
    currentIndex,
    maxIndex,
    resetNavigation,
    setMaxIndex,
    navigateToIndex,
    navigateUp,
    navigateDown,
    navigateToFirst,
    navigateToLast,
    registerListNavigation,
  }
}

/**
 * 检查是否为 Mac 系统
 */
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

/**
 * 格式化快捷键显示文本
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts = []
  const mac = isMac()

  if (shortcut.ctrl && !mac) parts.push('Ctrl')
  if (shortcut.meta && mac) parts.push('⌘')
  if (shortcut.alt) parts.push(mac ? '⌥' : 'Alt')
  if (shortcut.shift) parts.push(mac ? '⇧' : 'Shift')

  // 特殊键名映射
  const keyMap: Record<string, string> = {
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '⏎',
    ' ': 'Space',
  }

  const keyName = keyMap[shortcut.key] || shortcut.key.toUpperCase()
  parts.push(keyName)

  return parts.join(mac ? '' : '+')
}
