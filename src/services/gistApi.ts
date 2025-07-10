// GitHub Gist API服务

import { githubAuth, type GitHubToken } from './githubAuth'

/**
 * Gist文件内容
 */
export interface GistFile {
  filename: string
  content: string
  language?: string
  type?: string
  size?: number
}

/**
 * Gist信息
 */
export interface Gist {
  id: string
  description: string
  public: boolean
  files: Record<string, GistFile>
  html_url: string
  git_pull_url: string
  git_push_url: string
  created_at: string
  updated_at: string
  owner?: {
    login: string
    id: number
    avatar_url: string
  }
}

/**
 * 创建Gist的参数
 */
export interface CreateGistParams {
  description: string
  public: boolean
  files: Record<string, { content: string }>
}

/**
 * 更新Gist的参数
 */
export interface UpdateGistParams {
  description?: string
  files?: Record<string, { content?: string; filename?: string } | null>
}

/**
 * GitHub Gist API服务
 */
export class GistApiService {
  private readonly baseUrl = 'https://api.github.com'

  /**
   * 获取认证头
   */
  private getAuthHeaders(): Record<string, string> {
    const token = githubAuth.getToken()
    if (!token) {
      throw new Error('No GitHub token available')
    }

    return {
      Authorization: `Bearer ${token.access_token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    }
  }

  /**
   * 处理API响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`

      try {
        const errorData = JSON.parse(errorText)
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch {
        // 忽略JSON解析错误
      }

      throw new Error(errorMessage)
    }

    return response.json()
  }

  /**
   * 获取用户的所有Gist
   */
  async getUserGists(): Promise<Gist[]> {
    try {
      const response = await fetch(`${this.baseUrl}/gists`, {
        headers: this.getAuthHeaders(),
      })

      return this.handleResponse<Gist[]>(response)
    } catch (error) {
      console.error('Failed to fetch user gists:', error)
      throw error
    }
  }

  /**
   * 根据ID获取特定Gist
   */
  async getGist(gistId: string): Promise<Gist> {
    try {
      const response = await fetch(`${this.baseUrl}/gists/${gistId}`, {
        headers: this.getAuthHeaders(),
      })

      return this.handleResponse<Gist>(response)
    } catch (error) {
      console.error(`Failed to fetch gist ${gistId}:`, error)
      throw error
    }
  }

  /**
   * 创建新的Gist
   */
  async createGist(params: CreateGistParams): Promise<Gist> {
    try {
      const response = await fetch(`${this.baseUrl}/gists`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(params),
      })

      return this.handleResponse<Gist>(response)
    } catch (error) {
      console.error('Failed to create gist:', error)
      throw error
    }
  }

  /**
   * 更新现有Gist
   */
  async updateGist(gistId: string, params: UpdateGistParams): Promise<Gist> {
    try {
      const response = await fetch(`${this.baseUrl}/gists/${gistId}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(params),
      })

      return this.handleResponse<Gist>(response)
    } catch (error) {
      console.error(`Failed to update gist ${gistId}:`, error)
      throw error
    }
  }

  /**
   * 删除Gist
   */
  async deleteGist(gistId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/gists/${gistId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete gist: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Failed to delete gist ${gistId}:`, error)
      throw error
    }
  }

  /**
   * 检查Gist是否存在
   */
  async gistExists(gistId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/gists/${gistId}`, {
        method: 'HEAD',
        headers: this.getAuthHeaders(),
      })

      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 搜索用户的Gist（根据描述）
   */
  async searchGists(query: string): Promise<Gist[]> {
    try {
      const gists = await this.getUserGists()

      if (!query.trim()) return gists

      const lowerQuery = query.toLowerCase()
      return gists.filter(
        gist =>
          gist.description.toLowerCase().includes(lowerQuery) ||
          Object.keys(gist.files).some(filename => filename.toLowerCase().includes(lowerQuery))
      )
    } catch (error) {
      console.error('Failed to search gists:', error)
      throw error
    }
  }

  /**
   * 获取Gist的原始内容
   */
  async getGistRawContent(gist: Gist, filename: string): Promise<string> {
    const file = gist.files[filename]
    if (!file) {
      throw new Error(`File ${filename} not found in gist`)
    }

    // 如果内容已经在响应中，直接返回
    if (file.content) {
      return file.content
    }

    // 否则需要单独获取原始内容
    try {
      const response = await fetch(`${this.baseUrl}/gists/${gist.id}`, {
        headers: this.getAuthHeaders(),
      })

      const fullGist = await this.handleResponse<Gist>(response)
      const fullFile = fullGist.files[filename]

      if (!fullFile || !fullFile.content) {
        throw new Error(`Content not available for file ${filename}`)
      }

      return fullFile.content
    } catch (error) {
      console.error(`Failed to get raw content for ${filename}:`, error)
      throw error
    }
  }

  /**
   * 创建或更新配置Gist
   */
  async saveConfig(config: any, gistId?: string): Promise<Gist> {
    const configContent = JSON.stringify(config, null, 2)
    const filename = 'echo-nav-config.json'

    const gistData = {
      description: 'Echo Nav - Personal Navigation Configuration',
      public: false,
      files: {
        [filename]: {
          content: configContent,
        },
      },
    }

    if (gistId) {
      // 更新现有Gist
      return this.updateGist(gistId, gistData)
    } else {
      // 创建新Gist
      return this.createGist(gistData)
    }
  }

  /**
   * 从Gist加载配置
   */
  async loadConfig(gistId: string): Promise<any> {
    try {
      const gist = await this.getGist(gistId)
      const configFile = gist.files['echo-nav-config.json']

      if (!configFile) {
        throw new Error('Configuration file not found in gist')
      }

      const content = await this.getGistRawContent(gist, 'echo-nav-config.json')
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to load config from gist:', error)
      throw error
    }
  }

  /**
   * 查找配置Gist
   */
  async findConfigGist(): Promise<Gist | null> {
    try {
      const gists = await this.getUserGists()

      // 查找包含配置文件的Gist
      for (const gist of gists) {
        if (gist.files['echo-nav-config.json']) {
          return gist
        }
      }

      return null
    } catch (error) {
      console.error('Failed to find config gist:', error)
      return null
    }
  }

  /**
   * 验证API连接
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'HEAD',
        headers: this.getAuthHeaders(),
      })

      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * 默认Gist API服务实例
 */
export const gistApi = new GistApiService()
