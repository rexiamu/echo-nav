// 图标处理工具

/**
 * 获取网站favicon的URL
 */
export function getFaviconUrl(websiteUrl: string, size: number = 32): string {
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname

    // 使用更可靠的Google Favicon API，移除www前缀
    const cleanDomain = domain.replace(/^www\./, '')
    return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=${size}`
  } catch (error) {
    console.warn('Invalid URL for favicon:', websiteUrl)
    return getDefaultIcon()
  }
}

/**
 * 获取高质量favicon的URL
 */
export function getHighQualityFaviconUrl(websiteUrl: string): string {
  try {
    const url = new URL(websiteUrl)
    const domain = url.hostname

    // 尝试多个favicon服务
    const services = [
      `https://icon.horse/icon/${domain}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      `https://${domain}/favicon.ico`,
      `https://${domain}/apple-touch-icon.png`,
    ]

    return services[0] // 返回第一个服务，可以后续实现fallback机制
  } catch (error) {
    console.warn('Invalid URL for high quality favicon:', websiteUrl)
    return getDefaultIcon()
  }
}

/**
 * 获取默认图标
 */
export function getDefaultIcon(): string {
  // 返回一个简单的SVG图标作为默认图标
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzM3NDE1NSIvPgo8cGF0aCBkPSJNMTYgOEMxMi42ODYzIDggMTAgMTAuNjg2MyAxMCAxNEMxMCAxNy4zMTM3IDEyLjY4NjMgMjAgMTYgMjBDMTkuMzEzNyAyMCAyMiAxNy4zMTM3IDIyIDE0QzIyIDEwLjY4NjMgMTkuMzEzNyA4IDE2IDhaIiBmaWxsPSIjNjM2NkYxIi8+CjxwYXRoIGQ9Ik0xNiAyMkMxOC4yMDkxIDIyIDIwIDIwLjIwOTEgMjAgMThIMTJDMTIgMjAuMjA5MSAxMy43OTA5IDIyIDE2IDIyWiIgZmlsbD0iIzYzNjZGMSIvPgo8L3N2Zz4K'
}

/**
 * 检查图标是否加载成功
 */
export function checkIconLoad(iconUrl: string): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = iconUrl

    // 设置超时
    setTimeout(() => resolve(false), 3000)
  })
}

/**
 * 获取带fallback的图标URL
 */
export async function getIconWithFallback(websiteUrl: string): Promise<string> {
  const primaryIcon = getFaviconUrl(websiteUrl, 32)

  // 检查主要图标是否可用
  const isLoaded = await checkIconLoad(primaryIcon)
  if (isLoaded) {
    return primaryIcon
  }

  // 尝试高质量图标
  const highQualityIcon = getHighQualityFaviconUrl(websiteUrl)
  const isHighQualityLoaded = await checkIconLoad(highQualityIcon)
  if (isHighQualityLoaded) {
    return highQualityIcon
  }

  // 返回默认图标
  return getDefaultIcon()
}

/**
 * 从URL提取域名
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch (error) {
    return url
  }
}

/**
 * 生成网站首字母图标
 */
export function generateLetterIcon(name: string, size: number = 32): string {
  const letter = name.charAt(0).toUpperCase()
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6366F1',
  ]

  // 根据名称生成一致的颜色
  const colorIndex = name.charCodeAt(0) % colors.length
  const color = colors[colorIndex]

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.25}" fill="${color}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            fill="white" font-family="system-ui, sans-serif" 
            font-size="${size * 0.5}" font-weight="600">${letter}</text>
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * 获取网站图标（包含多种fallback策略）
 */
export async function getWebsiteIcon(websiteUrl: string, websiteName: string): Promise<string> {
  try {
    // 直接返回Google Favicon API，让浏览器处理错误
    // 如果加载失败，WebsiteCard组件的onError事件会处理fallback
    return getFaviconUrl(websiteUrl, 32)
  } catch (error) {
    console.warn('Error getting website icon:', error)
    return generateLetterIcon(websiteName)
  }
}

/**
 * 预加载图标
 */
export function preloadIcon(iconUrl: string): void {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = iconUrl
  document.head.appendChild(link)
}

/**
 * 批量预加载图标
 */
export function preloadIcons(iconUrls: string[]): void {
  iconUrls.forEach(url => preloadIcon(url))
}
