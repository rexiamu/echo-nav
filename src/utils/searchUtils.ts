// 搜索算法工具

import type { Website } from '@/types/website'

/**
 * 搜索结果项
 */
export interface SearchResult {
  item: Website
  score: number
  matches: SearchMatch[]
}

/**
 * 搜索匹配项
 */
export interface SearchMatch {
  field: string
  value: string
  indices: [number, number][]
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  threshold: number // 匹配阈值 (0-1)
  includeScore: boolean
  includeMatches: boolean
  keys: string[] // 搜索字段
  maxResults: number
}

/**
 * 默认搜索选项
 */
const defaultOptions: SearchOptions = {
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  keys: ['name', 'url', 'description', 'tags'],
  maxResults: 50,
}

/**
 * 计算字符串相似度 (Levenshtein距离)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length

  if (len1 === 0) return len2
  if (len2 === 0) return len1

  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(null))

  for (let i = 0; i <= len1; i++) matrix[i][0] = i
  for (let j = 0; j <= len2; j++) matrix[0][j] = j

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  const maxLen = Math.max(len1, len2)
  return maxLen === 0 ? 1 : 1 - matrix[len1][len2] / maxLen
}

/**
 * 查找匹配的索引位置
 */
function findMatchIndices(text: string, pattern: string): [number, number][] {
  const indices: [number, number][] = []
  const lowerText = text.toLowerCase()
  const lowerPattern = pattern.toLowerCase()

  let startIndex = 0
  while (true) {
    const index = lowerText.indexOf(lowerPattern, startIndex)
    if (index === -1) break

    indices.push([index, index + pattern.length])
    startIndex = index + 1
  }

  return indices
}

/**
 * 搜索单个字段
 */
function searchField(value: string, query: string): { score: number; matches: [number, number][] } {
  if (!value || !query) return { score: 0, matches: [] }

  const lowerValue = value.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // 精确匹配
  if (lowerValue.includes(lowerQuery)) {
    const matches = findMatchIndices(value, query)
    const score = lowerQuery.length / lowerValue.length
    return { score: score * 2, matches } // 精确匹配给更高分数
  }

  // 模糊匹配
  const similarity = calculateSimilarity(lowerValue, lowerQuery)
  return { score: similarity, matches: [] }
}

/**
 * 搜索网站数组
 */
export function searchWebsites(
  websites: Website[],
  query: string,
  options: Partial<SearchOptions> = {}
): SearchResult[] {
  if (!query.trim()) return []

  const opts = { ...defaultOptions, ...options }
  const results: SearchResult[] = []

  for (const website of websites) {
    let totalScore = 0
    const matches: SearchMatch[] = []

    // 搜索各个字段
    for (const key of opts.keys) {
      let value = ''

      switch (key) {
        case 'name':
          value = website.name
          break
        case 'url':
          value = website.url
          break
        case 'description':
          value = website.description || ''
          break
        case 'tags':
          value = website.tags.join(' ')
          break
        default:
          continue
      }

      const fieldResult = searchField(value, query)

      if (fieldResult.score > 0) {
        totalScore += fieldResult.score

        if (opts.includeMatches && fieldResult.matches.length > 0) {
          matches.push({
            field: key,
            value,
            indices: fieldResult.matches,
          })
        }
      }
    }

    // 计算平均分数
    const avgScore = totalScore / opts.keys.length

    if (avgScore >= opts.threshold) {
      results.push({
        item: website,
        score: avgScore,
        matches,
      })
    }
  }

  // 按分数排序并限制结果数量
  return results.sort((a, b) => b.score - a.score).slice(0, opts.maxResults)
}

/**
 * 高亮搜索结果
 */
export function highlightMatches(text: string, matches: [number, number][]): string {
  if (!matches.length) return text

  let result = ''
  let lastIndex = 0

  for (const [start, end] of matches) {
    result += text.slice(lastIndex, start)
    result += `<mark class="search-highlight">${text.slice(start, end)}</mark>`
    lastIndex = end
  }

  result += text.slice(lastIndex)
  return result
}

/**
 * 生成搜索建议
 */
export function generateSearchSuggestions(
  websites: Website[],
  query: string,
  maxSuggestions: number = 5
): string[] {
  if (!query.trim()) return []

  const suggestions = new Set<string>()
  const lowerQuery = query.toLowerCase()

  // 从网站名称中提取建议
  for (const website of websites) {
    const name = website.name.toLowerCase()
    if (name.includes(lowerQuery) && name !== lowerQuery) {
      suggestions.add(website.name)
    }

    // 从标签中提取建议
    for (const tag of website.tags) {
      const lowerTag = tag.toLowerCase()
      if (lowerTag.includes(lowerQuery) && lowerTag !== lowerQuery) {
        suggestions.add(tag)
      }
    }

    if (suggestions.size >= maxSuggestions) break
  }

  return Array.from(suggestions).slice(0, maxSuggestions)
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 搜索历史管理
 */
export class SearchHistory {
  private readonly storageKey = 'echo-nav-search-history'
  private readonly maxItems = 10

  getHistory(): string[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  addToHistory(query: string): void {
    if (!query.trim()) return

    const history = this.getHistory()
    const filtered = history.filter(item => item !== query)
    const newHistory = [query, ...filtered].slice(0, this.maxItems)

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(newHistory))
    } catch {
      // 忽略存储错误
    }
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(this.storageKey)
    } catch {
      // 忽略存储错误
    }
  }

  removeFromHistory(query: string): void {
    const history = this.getHistory()
    const filtered = history.filter(item => item !== query)

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    } catch {
      // 忽略存储错误
    }
  }
}
