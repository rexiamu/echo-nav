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
 * 认证结果
 */
export interface AuthResult {
  success: boolean
  user?: GitHubUser
  message?: string
}

/**
 * GitHub认证服务（支持PAT和OAuth）
 */
export class GitHubAuthService {
  private readonly storageKey = 'echo-nav-github-token'
  private readonly userStorageKey = 'echo-nav-github-user'
  private readonly stateStorageKey = 'echo-nav-oauth-state'

  // OAuth配置 (应从环境变量加载)
  private readonly clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  private readonly clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET
  private readonly redirectUri = window.location.origin + '/github/callback'
  private readonly corsProxyUrl = 'https://cors-anywhere.herokuapp.com/' // 用于解决CORS问题

  /**
   * 启动OAuth认证流程
   */
  startOAuth(): void {
    const state = this.generateState()
    this.saveState(state)

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'gist',
      state: state,
    })

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  /**
   * 处理OAuth回调
   */
  async handleCallback(code: string, state: string): Promise<AuthResult> {
    const savedState = this.getState()
    if (!state || state !== savedState) {
      return { success: false, message: '无效的state参数，可能存在CSRF攻击' }
    }
    this.clearState()

    try {
      const token = await this.exchangeCodeForToken(code)
      this.saveToken(token)

      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, message: '获取用户信息失败' }
      }

      return { success: true, user }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : '未知错误' }
    }
  }

  /**
   * 使用授权码换取Token
   */
  private async exchangeCodeForToken(code: string): Promise<GitHubToken> {
    const response = await fetch(
      `${this.corsProxyUrl}https://github.com/login/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
        }),
      }
    )

    if (!response.ok) {
      throw new Error('获取GitHub Token失败')
    }

    const data = await response.json()
    return { ...data, created_at: Date.now() }
  }

  /**
   * 使用Personal Access Token进行认证
   */
  async authenticateWithToken(token: string): Promise<AuthResult> {
    const testResult = await this.testToken(token)
    if (!testResult.isValid || !testResult.user) {
      return { success: false, message: testResult.error || 'Token测试失败' }
    }

    const tokenInfo: GitHubToken = {
      access_token: token,
      token_type: 'Bearer',
      scope: 'gist',
      created_at: Date.now(),
    }

    this.saveToken(tokenInfo)
    this.saveUser(testResult.user)

    return { success: true, user: testResult.user }
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
   * 生成并保存state
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private saveState(state: string): void {
    localStorage.setItem(this.stateStorageKey, state)
  }

  private getState(): string | null {
    return localStorage.getItem(this.stateStorageKey)
  }

  private clearState(): void {
    localStorage.removeItem(this.stateStorageKey)
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
