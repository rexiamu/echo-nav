// URL处理工具

/**
 * 验证URL格式
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * 标准化URL
 */
export function normalizeUrl(url: string): string {
  try {
    // 如果没有协议，默认添加https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    const urlObj = new URL(url)
    
    // 移除末尾的斜杠
    if (urlObj.pathname === '/') {
      urlObj.pathname = ''
    }
    
    return urlObj.toString()
  } catch {
    return url
  }
}

/**
 * 从URL提取域名
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * 获取网站预览信息
 */
export async function getWebsitePreview(url: string): Promise<{
  title: string
  url: string
  icon?: string
}> {
  try {
    const normalizedUrl = normalizeUrl(url)
    
    // 尝试获取网站标题和图标
    const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(normalizedUrl)}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch website preview')
    }
    
    const data = await response.json()
    
    if (data.status === 'success') {
      return {
        title: data.data.title || extractDomain(normalizedUrl),
        url: normalizedUrl,
        icon: data.data.logo?.url || `https://www.google.com/s2/favicons?domain=${extractDomain(normalizedUrl)}&sz=32`,
      }
    }
    
    throw new Error('API returned error status')
  } catch (error) {
    console.warn('Failed to get website preview:', error)
    
    // Fallback: 返回基本信息
    const normalizedUrl = normalizeUrl(url)
    return {
      title: extractDomain(normalizedUrl),
      url: normalizedUrl,
      icon: `https://www.google.com/s2/favicons?domain=${extractDomain(normalizedUrl)}&sz=32`,
    }
  }
}

/**
 * 检查URL是否可访问
 */
export async function checkUrlAccessibility(url: string): Promise<boolean> {
  try {
    const normalizedUrl = normalizeUrl(url)
    
    // 使用HEAD请求检查URL是否可访问
    const response = await fetch(normalizedUrl, {
      method: 'HEAD',
      mode: 'no-cors', // 避免CORS问题
    })
    
    return true // 如果没有抛出错误，说明URL可访问
  } catch {
    return false
  }
}

/**
 * 从URL中提取可能的网站名称
 */
export function extractWebsiteName(url: string): string {
  try {
    const domain = extractDomain(url)
    
    // 移除常见的顶级域名
    const name = domain
      .replace(/\.(com|org|net|edu|gov|mil|int|co|io|me|ly|tv|cc|tk|ml|ga|cf)$/i, '')
      .replace(/\.(cn|uk|de|fr|jp|kr|in|au|ca|br|ru|it|es|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|lt|lv|ee|mt|cy|lu|be|at|ch|li|mc|sm|va|ad|gi|im|je|gg|fo|gl|is|ax|sj|bv|hm|tf|aq|gs|sh|ac|ta|io|cc|tv|tk|ml|ga|cf|pw|ws|nu|to|ki|nr|na|fm|mh|mp|gu|as|vi|pr|um|us|ca|mx|gt|bz|sv|hn|ni|cr|pa|cu|jm|ht|do|tt|bb|gd|lc|vc|ag|kn|dm|aw|cw|sx|bq|tc|vg|ai|ms|ky|bm|fk|pn|sh|ac|ta)$/i, '')
    
    // 首字母大写
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'Website'
  }
}

/**
 * 生成网站的短链接
 */
export function generateShortUrl(url: string, maxLength: number = 50): string {
  try {
    const urlObj = new URL(url)
    let shortUrl = urlObj.hostname + urlObj.pathname
    
    if (shortUrl.length > maxLength) {
      shortUrl = shortUrl.substring(0, maxLength - 3) + '...'
    }
    
    return shortUrl
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength - 3) + '...' : url
  }
}

/**
 * 检查URL是否为本地地址
 */
export function isLocalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    )
  } catch {
    return false
  }
}

/**
 * 获取URL的协议
 */
export function getUrlProtocol(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol
  } catch {
    return 'https:'
  }
}

/**
 * 检查两个URL是否指向同一个域名
 */
export function isSameDomain(url1: string, url2: string): boolean {
  try {
    const domain1 = extractDomain(url1)
    const domain2 = extractDomain(url2)
    return domain1 === domain2
  } catch {
    return false
  }
}
