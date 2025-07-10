// GitHub Personal Access Token认证服务

/**
 * GitHub用户信息
 */
export interface GitHubUser {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  html_url: string
}

/**
 * GitHub访问令牌信息
 */
export interface GitHubToken {
  access_token: string
  token_type: string
  scope: string
  created_at: number
}

/**
 * GitHub认证服务（基于Personal Access Token）
 */
export class GitHubAuthService {
  private readonly storageKey = 'echo-nav-github-token'
  private readonly userStorageKey = 'echo-nav-github-user'

  /**
   * 使用Personal Access Token进行认证
   */
  async authenticateWithToken(token: string): Promise<GitHubUser> {
    try {
      // 验证token格式
      if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        throw new Error('无效的token格式。Personal Access Token应该以 ghp_ 或 github_pat_ 开头。')
      }

      // 测试token并获取用户信息
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token无效或已过期，请检查token是否正确。')
        } else if (response.status === 403) {
          throw new Error('Token权限不足，请确保token具有 gist 权限。')
        } else {
          throw new Error(`GitHub API错误: ${response.status} ${response.statusText}`)
        }
      }

      const userData = await response.json()

      // 创建token信息
      const tokenInfo: GitHubToken = {
        access_token: token,
        token_type: 'Bearer',
        scope: 'gist',
        created_at: Date.now(),
      }

      // 保存token和用户信息
      this.saveToken(tokenInfo)
      this.saveUser(userData)

      return userData
    } catch (error) {
      console.error('Token authentication failed:', error)
      throw error
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<GitHubUser | null> {
    const token = this.getToken()
    if (!token) return null

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `${token.token_type} ${token.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 令牌无效，清除本地存储
          this.clearAuth()
          return null
        }
        throw new Error(`Failed to fetch user info: ${response.statusText}`)
      }

      const user = await response.json()

      // 缓存用户信息
      this.saveUser(user)

      return user
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * 检查令牌是否有效
   */
  async isTokenValid(): Promise<boolean> {
    const token = this.getToken()
    if (!token) return false

    // Personal Access Token通常不会过期，除非用户手动撤销
    // 通过API调用验证令牌
    try {
      const response = await fetch('https://api.github.com/user', {
        method: 'HEAD',
        headers: {
          Authorization: `${token.token_type} ${token.access_token}`,
        },
      })

      if (!response.ok) {
        this.clearAuth()
        return false
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * 获取存储的令牌
   */
  getToken(): GitHubToken | null {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  /**
   * 保存令牌
   */
  private saveToken(token: GitHubToken): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(token))
    } catch (error) {
      console.error('Failed to save token:', error)
    }
  }

  /**
   * 获取缓存的用户信息
   */
  getCachedUser(): GitHubUser | null {
    try {
      const stored = localStorage.getItem(this.userStorageKey)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  /**
   * 保存用户信息
   */
  private saveUser(user: GitHubUser): void {
    try {
      localStorage.setItem(this.userStorageKey, JSON.stringify(user))
    } catch (error) {
      console.error('Failed to save user info:', error)
    }
  }

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem(this.userStorageKey)
    } catch (error) {
      console.error('Failed to clear auth:', error)
    }
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  /**
   * 测试Personal Access Token
   */
  async testToken(token: string): Promise<{ isValid: boolean; user?: GitHubUser; error?: string }> {
    try {
      // 验证token格式
      if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        return {
          isValid: false,
          error: 'Token格式错误。应该以 ghp_ 或 github_pat_ 开头。',
        }
      }

      // 测试token
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          return { isValid: false, error: 'Token无效或已过期' }
        } else if (response.status === 403) {
          return { isValid: false, error: 'Token权限不足，请确保具有gist权限' }
        } else {
          return { isValid: false, error: `API错误: ${response.status}` }
        }
      }

      const userData = await response.json()
      return { isValid: true, user: userData }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : '测试失败',
      }
    }
  }
}

/**
 * 默认GitHub认证服务实例
 */
export const githubAuth = new GitHubAuthService()
