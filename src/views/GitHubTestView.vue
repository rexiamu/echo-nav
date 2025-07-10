<template>
  <div class="test-view">
    <div class="test-container">
      <div class="test-header">
        <h1 class="test-title">GitHub OAuth 测试工具</h1>
        <p class="test-description">
          这个页面帮助您诊断和测试GitHub OAuth配置是否正确。
        </p>
      </div>

      <div class="test-sections">
        <!-- 环境变量检查 -->
        <div class="test-section">
          <h2 class="section-title">1. 环境变量检查</h2>
          <div class="test-results">
            <div class="test-item" :class="envCheck.clientId.status">
              <span class="test-label">VITE_GITHUB_CLIENT_ID:</span>
              <span class="test-value">{{ envCheck.clientId.value }}</span>
              <span class="test-status">{{ envCheck.clientId.message }}</span>
            </div>
            <div class="test-item" :class="envCheck.clientSecret.status">
              <span class="test-label">VITE_GITHUB_CLIENT_SECRET:</span>
              <span class="test-value">{{ envCheck.clientSecret.value }}</span>
              <span class="test-status">{{ envCheck.clientSecret.message }}</span>
            </div>
          </div>
        </div>

        <!-- URL配置检查 -->
        <div class="test-section">
          <h2 class="section-title">2. URL配置检查</h2>
          <div class="test-results">
            <div class="test-item">
              <span class="test-label">当前域名:</span>
              <span class="test-value">{{ currentOrigin }}</span>
            </div>
            <div class="test-item">
              <span class="test-label">回调URL:</span>
              <span class="test-value">{{ callbackUrl }}</span>
            </div>
            <div class="test-item">
              <span class="test-label">OAuth授权URL:</span>
              <span class="test-value">{{ authUrl }}</span>
            </div>
          </div>
        </div>

        <!-- GitHub API连接测试 -->
        <div class="test-section">
          <h2 class="section-title">3. GitHub API连接测试</h2>
          <div class="test-actions">
            <button @click="testGitHubAPI" :disabled="isTestingAPI" class="test-button">
              {{ isTestingAPI ? '测试中...' : '测试GitHub API' }}
            </button>
          </div>
          <div v-if="apiTestResult" class="test-results">
            <div class="test-item" :class="apiTestResult.success ? 'success' : 'error'">
              <span class="test-status">{{ apiTestResult.message }}</span>
            </div>
            <div v-if="apiTestResult.details" class="test-details">
              <pre>{{ JSON.stringify(apiTestResult.details, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <!-- OAuth流程测试 -->
        <div class="test-section">
          <h2 class="section-title">4. OAuth流程测试</h2>
          <div class="test-actions">
            <button @click="testOAuthFlow" :disabled="!canTestOAuth || isTestingOAuth" class="test-button primary">
              {{ isTestingOAuth ? '测试中...' : '测试OAuth流程' }}
            </button>
          </div>
          <div v-if="oauthTestResult" class="test-results">
            <div class="test-item" :class="oauthTestResult.success ? 'success' : 'error'">
              <span class="test-status">{{ oauthTestResult.message }}</span>
            </div>
          </div>
        </div>

        <!-- 配置指南 -->
        <div class="test-section">
          <h2 class="section-title">5. 配置指南</h2>
          <div class="config-guide">
            <h3>如果测试失败，请按照以下步骤配置：</h3>
            <ol class="guide-steps">
              <li>
                <strong>创建GitHub OAuth应用：</strong>
                <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener">
                  访问GitHub Developer Settings
                </a>
              </li>
              <li>
                <strong>填写应用信息：</strong>
                <ul>
                  <li>Application name: Echo Nav Dev</li>
                  <li>Homepage URL: <code>{{ currentOrigin }}</code></li>
                  <li>Authorization callback URL: <code>{{ callbackUrl }}</code></li>
                </ul>
              </li>
              <li>
                <strong>配置环境变量：</strong>
                在项目根目录的 <code>.env.local</code> 文件中添加：
                <pre class="code-block">VITE_GITHUB_CLIENT_ID=your_client_id_here
VITE_GITHUB_CLIENT_SECRET=your_client_secret_here</pre>
              </li>
              <li>
                <strong>重启开发服务器：</strong>
                <code>pnpm dev</code>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div class="test-footer">
        <router-link to="/" class="back-link">← 返回主页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { githubAuth } from '@/services/githubAuth'

// 状态
const isTestingAPI = ref(false)
const isTestingOAuth = ref(false)
const apiTestResult = ref<{ success: boolean; message: string; details?: any } | null>(null)
const oauthTestResult = ref<{ success: boolean; message: string } | null>(null)

// 计算属性
const currentOrigin = computed(() => window.location.origin)
const callbackUrl = computed(() => `${currentOrigin.value}/auth/github/callback`)
const authUrl = computed(() => {
  // OAuth功能已移除，返回提示信息
  return 'OAuth功能已移除，建议使用Personal Access Token'
})

const envCheck = computed(() => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET

  return {
    clientId: {
      value: clientId ? `${clientId.substring(0, 8)}...` : '未设置',
      status: clientId ? 'success' : 'error',
      message: clientId ? '✅ 已设置' : '❌ 未设置'
    },
    clientSecret: {
      value: clientSecret ? '已设置 (隐藏)' : '未设置',
      status: clientSecret ? 'success' : 'error',
      message: clientSecret ? '✅ 已设置' : '❌ 未设置'
    }
  }
})

const canTestOAuth = computed(() => {
  return envCheck.value.clientId.status === 'success' &&
    envCheck.value.clientSecret.status === 'success'
})

// 方法
const testGitHubAPI = async () => {
  isTestingAPI.value = true
  apiTestResult.value = null

  try {
    const response = await fetch('https://api.github.com/rate_limit')

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    apiTestResult.value = {
      success: true,
      message: '✅ GitHub API连接成功',
      details: {
        rate_limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000).toLocaleString()
      }
    }
  } catch (error) {
    apiTestResult.value = {
      success: false,
      message: `❌ GitHub API连接失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  } finally {
    isTestingAPI.value = false
  }
}

const testOAuthFlow = async () => {
  isTestingOAuth.value = true
  oauthTestResult.value = null

  try {
    // OAuth功能已移除，显示提示信息
    oauthTestResult.value = {
      success: false,
      message: '⚠️ OAuth功能已移除。建议使用Personal Access Token进行认证，更简单安全。'
    }

  } catch (error) {
    oauthTestResult.value = {
      success: false,
      message: `❌ 测试失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  } finally {
    isTestingOAuth.value = false
  }
}

// 生命周期
onMounted(() => {
  // 自动运行API测试
  testGitHubAPI()
})
</script>

<style scoped>
.test-view {
  min-height: 100vh;
  background-color: rgb(249 250 251);
  padding: 2rem 1rem;
}

.dark .test-view {
  background-color: rgb(17 24 39);
}

.test-container {
  max-width: 800px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 2rem;
}

.test-title {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(17 24 39);
  margin: 0 0 1rem 0;
}

.dark .test-title {
  color: rgb(243 244 246);
}

.test-description {
  color: rgb(107 114 128);
  margin: 0;
  font-size: 1.125rem;
}

.dark .test-description {
  color: rgb(156 163 175);
}

.test-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.test-section {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .test-section {
  background-color: rgb(31 41 55);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0 0 1rem 0;
}

.dark .section-title {
  color: rgb(243 244 246);
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.test-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: rgb(249 250 251);
}

.dark .test-item {
  background-color: rgb(55 65 81);
}

.test-item.success {
  background-color: rgb(240 253 244);
  border: 1px solid rgb(34 197 94);
}

.dark .test-item.success {
  background-color: rgb(20 83 45);
  border-color: rgb(34 197 94);
}

.test-item.error {
  background-color: rgb(254 242 242);
  border: 1px solid rgb(239 68 68);
}

.dark .test-item.error {
  background-color: rgb(127 29 29);
  border-color: rgb(239 68 68);
}

.test-label {
  font-weight: 500;
  color: rgb(17 24 39);
  min-width: 200px;
}

.dark .test-label {
  color: rgb(243 244 246);
}

.test-value {
  font-family: monospace;
  color: rgb(107 114 128);
  flex: 1;
  word-break: break-all;
}

.dark .test-value {
  color: rgb(156 163 175);
}

.test-status {
  font-weight: 500;
}

.test-item.success .test-status {
  color: rgb(34 197 94);
}

.test-item.error .test-status {
  color: rgb(239 68 68);
}

.test-actions {
  margin-bottom: 1rem;
}

.test-button {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  background-color: white;
  color: rgb(17 24 39);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .test-button {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

.test-button:hover:not(:disabled) {
  background-color: rgb(249 250 251);
}

.dark .test-button:hover:not(:disabled) {
  background-color: rgb(75 85 99);
}

.test-button.primary {
  background-color: rgb(59 130 246);
  border-color: rgb(59 130 246);
  color: white;
}

.test-button.primary:hover:not(:disabled) {
  background-color: rgb(37 99 235);
}

.test-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-details {
  margin-top: 0.5rem;
}

.test-details pre {
  background-color: rgb(17 24 39);
  color: rgb(243 244 246);
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
}

.config-guide h3 {
  color: rgb(17 24 39);
  margin: 0 0 1rem 0;
}

.dark .config-guide h3 {
  color: rgb(243 244 246);
}

.guide-steps {
  color: rgb(107 114 128);
  line-height: 1.6;
}

.dark .guide-steps {
  color: rgb(156 163 175);
}

.guide-steps li {
  margin-bottom: 1rem;
}

.guide-steps strong {
  color: rgb(17 24 39);
}

.dark .guide-steps strong {
  color: rgb(243 244 246);
}

.guide-steps a {
  color: rgb(59 130 246);
  text-decoration: none;
}

.guide-steps a:hover {
  text-decoration: underline;
}

.code-block {
  background-color: rgb(17 24 39);
  color: rgb(243 244 246);
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 0.5rem 0;
  font-family: monospace;
  font-size: 0.875rem;
}

.test-footer {
  text-align: center;
  margin-top: 2rem;
}

.back-link {
  color: rgb(59 130 246);
  text-decoration: none;
  font-weight: 500;
}

.back-link:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .test-view {
    padding: 1rem 0.5rem;
  }

  .test-section {
    padding: 1rem;
  }

  .test-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .test-label {
    min-width: auto;
  }
}
</style>
