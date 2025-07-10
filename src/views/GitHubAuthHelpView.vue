<template>
  <div class="auth-help-view">
    <div class="auth-help-container">
      <div class="auth-help-header">
        <h1 class="auth-help-title">GitHub认证帮助</h1>
        <p class="auth-help-description">
          如果您遇到GitHub认证问题，请选择以下任一方式进行认证：
        </p>
      </div>

      <div class="auth-methods">
        <!-- 方法1: Personal Access Token (推荐) -->
        <div class="auth-method recommended">
          <div class="method-header">
            <h2 class="method-title">
              <span class="method-badge">推荐</span>
              方法1: Personal Access Token
            </h2>
            <p class="method-description">
              最简单、最可靠的认证方式，无需复杂的OAuth流程。
            </p>
          </div>

          <div class="method-steps">
            <h3>步骤：</h3>
            <ol>
              <li>
                <strong>创建Token：</strong>
                <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener" class="external-link">
                  访问GitHub Token Settings ↗
                </a>
              </li>
              <li><strong>填写信息：</strong>
                <ul>
                  <li>Note: <code>Echo Nav Sync</code></li>
                  <li>Expiration: 选择合适的过期时间</li>
                  <li>Scopes: 勾选 <code>gist</code> 权限</li>
                </ul>
              </li>
              <li><strong>生成Token：</strong> 点击 "Generate token" 按钮</li>
              <li><strong>复制Token：</strong> 复制生成的token（以 <code>ghp_</code> 开头）</li>
              <li><strong>使用Token：</strong> 在下面的输入框中粘贴token</li>
            </ol>
          </div>

          <div class="token-input-area">
            <div class="input-group">
              <label for="token-input" class="input-label">Personal Access Token:</label>
              <input id="token-input" v-model="personalToken" type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" class="token-input" @paste="handleTokenPaste" />
            </div>

            <div class="input-actions">
              <button @click="authenticateWithToken" :disabled="!personalToken.trim() || isAuthenticating"
                class="auth-button primary">
                {{ isAuthenticating ? '认证中...' : '使用Token认证' }}
              </button>

              <button @click="testToken" :disabled="!personalToken.trim()" class="auth-button secondary">
                测试Token
              </button>
            </div>

            <div v-if="authResult" class="auth-result" :class="authResult.success ? 'success' : 'error'">
              <div class="result-icon">
                {{ authResult.success ? '✅' : '❌' }}
              </div>
              <div class="result-message">{{ authResult.message }}</div>
            </div>
          </div>
        </div>

        <!-- 方法2: OAuth认证 -->
        <div class="auth-method">
          <div class="method-header">
            <h2 class="method-title">方法2: OAuth认证</h2>
            <p class="method-description">
              标准的OAuth流程，可能会遇到CORS问题。
            </p>
          </div>

          <div class="method-content">
            <p class="method-note">
              <strong>注意：</strong> 此方法可能在某些网络环境下失败（CORS错误）。
              如果失败，请使用上面的Personal Access Token方法。
            </p>

            <button @click="startOAuth" class="auth-button secondary">
              尝试OAuth认证
            </button>
          </div>
        </div>

        <!-- 方法3: 手动配置 -->
        <div class="auth-method">
          <div class="method-header">
            <h2 class="method-title">方法3: 手动配置</h2>
            <p class="method-description">
              如果以上方法都失败，可以手动配置GitHub同步。
            </p>
          </div>

          <div class="method-content">
            <div class="manual-steps">
              <h4>手动配置步骤：</h4>
              <ol>
                <li>创建GitHub Gist存储配置</li>
                <li>获取Gist ID</li>
                <li>在应用中手动输入Gist ID</li>
              </ol>
            </div>

            <router-link to="/github-test" class="auth-button secondary">
              查看详细配置指南
            </router-link>
          </div>
        </div>
      </div>

      <div class="auth-help-footer">
        <div class="help-links">
          <a href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token"
            target="_blank" rel="noopener" class="help-link">
            GitHub官方文档 ↗
          </a>
          <router-link to="/" class="help-link">← 返回主页</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSyncStore } from '@/stores/syncStore'
import { githubAuth } from '@/services/githubAuth'

// Router和Store
const router = useRouter()
const syncStore = useSyncStore()

// 状态
const personalToken = ref('')
const isAuthenticating = ref(false)
const authResult = ref<{ success: boolean; message: string } | null>(null)

// 方法
const handleTokenPaste = (event: ClipboardEvent) => {
  // 自动清理粘贴的token
  setTimeout(() => {
    personalToken.value = personalToken.value.trim()
  }, 0)
}

const testToken = async () => {
  if (!personalToken.value.trim()) return

  authResult.value = null
  const result = await githubAuth.testToken(personalToken.value.trim())

  if (result.isValid && result.user) {
    authResult.value = {
      success: true,
      message: `✅ Token有效！用户: ${result.user.name || result.user.login}`
    }
  } else {
    authResult.value = {
      success: false,
      message: result.error || '测试失败'
    }
  }
}

const authenticateWithToken = async () => {
  if (!personalToken.value.trim()) return

  isAuthenticating.value = true
  authResult.value = null

  try {
    const result = await syncStore.loginWithToken(personalToken.value.trim())

    authResult.value = {
      success: true,
      message: `🎉 认证成功！欢迎，${syncStore.user?.name || syncStore.user?.login}！`
    }

    // 延迟跳转
    setTimeout(() => {
      router.push('/')
    }, 2000)

  } catch (error) {
    authResult.value = {
      success: false,
      message: `认证失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  } finally {
    isAuthenticating.value = false
  }
}

const startOAuth = () => {
  githubAuth.startOAuth()
}
</script>

<style scoped>
.auth-help-view {
  min-height: 100vh;
  background-color: rgb(249 250 251);
  padding: 2rem 1rem;
}

.dark .auth-help-view {
  background-color: rgb(17 24 39);
}

.auth-help-container {
  max-width: 900px;
  margin: 0 auto;
}

.auth-help-header {
  text-align: center;
  margin-bottom: 3rem;
}

.auth-help-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: rgb(17 24 39);
  margin: 0 0 1rem 0;
}

.dark .auth-help-title {
  color: rgb(243 244 246);
}

.auth-help-description {
  font-size: 1.125rem;
  color: rgb(107 114 128);
  margin: 0;
}

.dark .auth-help-description {
  color: rgb(156 163 175);
}

.auth-methods {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.auth-method {
  background-color: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid rgb(229 231 235);
}

.dark .auth-method {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
}

.auth-method.recommended {
  border-color: rgb(34 197 94);
  position: relative;
}

.method-header {
  margin-bottom: 1.5rem;
}

.method-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dark .method-title {
  color: rgb(243 244 246);
}

.method-badge {
  background-color: rgb(34 197 94);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.method-description {
  color: rgb(107 114 128);
  margin: 0;
}

.dark .method-description {
  color: rgb(156 163 175);
}

.method-steps h3 {
  color: rgb(17 24 39);
  margin: 0 0 1rem 0;
}

.dark .method-steps h3 {
  color: rgb(243 244 246);
}

.method-steps ol {
  color: rgb(107 114 128);
  line-height: 1.6;
  padding-left: 1.25rem;
}

.dark .method-steps ol {
  color: rgb(156 163 175);
}

.method-steps li {
  margin-bottom: 0.75rem;
}

.external-link {
  color: rgb(59 130 246);
  text-decoration: none;
  font-weight: 500;
}

.external-link:hover {
  text-decoration: underline;
}

.method-steps code {
  background-color: rgb(229 231 235);
  color: rgb(17 24 39);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.dark .method-steps code {
  background-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

.token-input-area {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: rgb(249 250 251);
  border-radius: 0.75rem;
}

.dark .token-input-area {
  background-color: rgb(55 65 81);
}

.input-group {
  margin-bottom: 1rem;
}

.input-label {
  display: block;
  font-weight: 500;
  color: rgb(17 24 39);
  margin-bottom: 0.5rem;
}

.dark .input-label {
  color: rgb(243 244 246);
}

.token-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  background-color: white;
  color: rgb(17 24 39);
  font-family: monospace;
  font-size: 0.875rem;
}

.dark .token-input {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

.token-input:focus {
  outline: none;
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.auth-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  border: none;
}

.auth-button.primary {
  background-color: rgb(59 130 246);
  color: white;
}

.auth-button.primary:hover:not(:disabled) {
  background-color: rgb(37 99 235);
}

.auth-button.secondary {
  background-color: white;
  color: rgb(59 130 246);
  border: 1px solid rgb(59 130 246);
}

.dark .auth-button.secondary {
  background-color: rgb(31 41 55);
  color: rgb(147 197 253);
  border-color: rgb(147 197 253);
}

.auth-button.secondary:hover:not(:disabled) {
  background-color: rgb(59 130 246);
  color: white;
}

.auth-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
}

.auth-result.success {
  background-color: rgb(240 253 244);
  border: 1px solid rgb(34 197 94);
  color: rgb(22 163 74);
}

.dark .auth-result.success {
  background-color: rgb(20 83 45);
  color: rgb(134 239 172);
}

.auth-result.error {
  background-color: rgb(254 242 242);
  border: 1px solid rgb(239 68 68);
  color: rgb(220 38 38);
}

.dark .auth-result.error {
  background-color: rgb(127 29 29);
  color: rgb(248 113 113);
}

.result-icon {
  font-size: 1.25rem;
}

.method-note {
  background-color: rgb(255 247 237);
  border: 1px solid rgb(251 191 36);
  color: rgb(146 64 14);
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.dark .method-note {
  background-color: rgb(120 53 15);
  color: rgb(253 186 116);
}

.manual-steps h4 {
  color: rgb(17 24 39);
  margin: 0 0 0.75rem 0;
}

.dark .manual-steps h4 {
  color: rgb(243 244 246);
}

.manual-steps ol {
  color: rgb(107 114 128);
  line-height: 1.6;
  padding-left: 1.25rem;
  margin-bottom: 1rem;
}

.dark .manual-steps ol {
  color: rgb(156 163 175);
}

.auth-help-footer {
  margin-top: 3rem;
  text-align: center;
}

.help-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.help-link {
  color: rgb(59 130 246);
  text-decoration: none;
  font-weight: 500;
}

.help-link:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .auth-help-view {
    padding: 1rem 0.5rem;
  }

  .auth-method {
    padding: 1.5rem;
  }

  .input-actions {
    flex-direction: column;
  }

  .help-links {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
