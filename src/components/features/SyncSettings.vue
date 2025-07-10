<template>
  <div class="sync-settings">
    <!-- GitHub认证状态 -->
    <div class="sync-section">
      <h3 class="section-title">GitHub同步</h3>

      <div v-if="!isAuthenticated" class="auth-section">
        <div class="auth-info">
          <div class="auth-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
          <div class="auth-content">
            <h4 class="auth-title">连接GitHub账户</h4>
            <p class="auth-description">
              通过GitHub Gist同步您的导航配置，在多个设备间保持数据一致。
            </p>

            <div class="auth-help">
              <p><strong>认证失败？</strong></p>
              <div class="help-options">
                <router-link to="/github-auth-help" class="help-button primary">
                  🚀 获取认证帮助
                </router-link>
                <button @click="showTokenInput = true" class="help-button secondary">
                  🔑 使用Token认证
                </button>
                <router-link to="/github-test" class="help-button secondary">
                  🔧 诊断工具
                </router-link>
              </div>
            </div>

            <!-- Personal Access Token 输入 -->
            <div v-if="showTokenInput" class="token-input-section">
              <h5 class="token-title">使用Personal Access Token</h5>
              <p class="token-description">
                如果OAuth认证失败，您可以使用GitHub Personal Access Token作为替代方案。
              </p>

              <div class="token-steps">
                <ol>
                  <li>访问 <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">GitHub Token
                      Settings</a></li>
                  <li>创建新的Personal Access Token</li>
                  <li>选择 <code>gist</code> 权限</li>
                  <li>复制生成的token并粘贴到下面</li>
                </ol>
              </div>

              <div class="token-form">
                <input v-model="personalToken" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  class="token-input" />
                <div class="token-actions">
                  <BaseButton @click="handleTokenAuth" :loading="isTokenAuthenticating"
                    :disabled="!personalToken.trim()" size="sm">
                    使用Token认证
                  </BaseButton>
                  <BaseButton variant="secondary" size="sm" @click="showTokenInput = false">
                    取消
                  </BaseButton>
                </div>
              </div>
            </div>

            <!-- 调试信息 -->
            <div class="debug-info" v-if="showDebugInfo">
              <h5>调试信息：</h5>
              <p><strong>Client ID:</strong> {{ debugInfo.clientId || '未设置' }}</p>
              <p><strong>Callback URL:</strong> {{ debugInfo.callbackUrl }}</p>
              <p><strong>环境变量状态:</strong> {{ debugInfo.envStatus }}</p>

              <div class="config-test" v-if="configTest">
                <h6>配置测试结果：</h6>
                <div v-if="configTest.isValid" class="test-success">
                  ✅ 配置正确，可以尝试认证
                </div>
                <div v-else class="test-errors">
                  <div class="error-item" v-for="error in configTest.errors" :key="error">
                    ❌ {{ error }}
                  </div>
                </div>
              </div>

              <div class="connection-test" v-if="testResult">
                <h6>连接测试结果：</h6>
                <div v-if="testResult.success" class="test-success">
                  {{ testResult.message }}
                </div>
                <div v-else class="test-errors">
                  <div class="error-item">
                    {{ testResult.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="auth-actions">
          <!-- OAuth认证已移除，请使用Personal Access Token -->

          <BaseButton variant="secondary" size="sm" @click="toggleDebugInfo" class="debug-button">
            {{ showDebugInfo ? '隐藏' : '显示' }}调试信息
          </BaseButton>

          <BaseButton variant="secondary" size="sm" @click="testGitHubConnection" class="test-button"
            :loading="isTestingConnection">
            测试GitHub连接
          </BaseButton>
        </div>
      </div>

      <div v-else class="connected-section">
        <!-- 用户信息 -->
        <div class="user-info">
          <img :src="user?.avatar_url" :alt="user?.name" class="user-avatar" />
          <div class="user-details">
            <div class="user-name">{{ user?.name || user?.login }}</div>
            <div class="user-login">@{{ user?.login }}</div>
          </div>
          <BaseButton variant="secondary" size="sm" @click="handleLogout">
            断开连接
          </BaseButton>
        </div>

        <!-- 同步状态 -->
        <div class="sync-status">
          <div class="status-info">
            <div class="status-indicator" :class="statusClass">
              <div class="status-dot"></div>
              <span class="status-text">{{ statusText }}</span>
            </div>
            <div class="last-sync">
              最后同步: {{ lastSyncFormatted }}
            </div>
          </div>

          <div class="sync-actions">
            <BaseButton size="sm" @click="handleSync" :loading="isSyncing" :disabled="isSyncing">
              <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6m2-3a9 9 0 0 1 13 0m-13 0a9 9 0 0 0 13 0" />
              </svg>
              立即同步
            </BaseButton>

            <BaseButton variant="secondary" size="sm" @click="handleUpload" :disabled="isSyncing">
              上传配置
            </BaseButton>

            <BaseButton variant="secondary" size="sm" @click="handleDownload" :disabled="isSyncing || !configGist">
              下载配置
            </BaseButton>
          </div>
        </div>

        <!-- 自动同步设置 -->
        <div class="auto-sync-settings">
          <div class="setting-item">
            <label class="setting-label">
              <input v-model="autoSyncEnabled" type="checkbox" class="setting-checkbox"
                @change="handleAutoSyncChange" />
              <span>启用自动同步</span>
            </label>
          </div>

          <div v-if="autoSyncEnabled" class="setting-item">
            <label class="setting-label">同步间隔</label>
            <select v-model="syncInterval" class="setting-select" @change="handleIntervalChange">
              <option :value="5">5分钟</option>
              <option :value="15">15分钟</option>
              <option :value="30">30分钟</option>
              <option :value="60">1小时</option>
              <option :value="180">3小时</option>
            </select>
          </div>
        </div>

        <!-- 同步历史 -->
        <div class="sync-history">
          <div class="history-header">
            <h4 class="history-title">同步历史</h4>
            <BaseButton variant="secondary" size="sm" @click="clearHistory">
              清除历史
            </BaseButton>
          </div>

          <div class="history-list">
            <div v-for="item in syncHistory.slice(0, 5)" :key="item.id" class="history-item">
              <div class="history-status" :class="item.status">
                <div class="history-dot"></div>
              </div>
              <div class="history-content">
                <div class="history-message">{{ item.message }}</div>
                <div class="history-time">{{ formatTime(item.timestamp) }}</div>
                <div v-if="item.changes" class="history-changes">
                  <span v-if="item.changes.websitesAdded">+{{ item.changes.websitesAdded }}网站</span>
                  <span v-if="item.changes.websitesModified">~{{ item.changes.websitesModified }}修改</span>
                  <span v-if="item.changes.websitesDeleted">-{{ item.changes.websitesDeleted }}删除</span>
                </div>
              </div>
            </div>

            <div v-if="syncHistory.length === 0" class="history-empty">
              暂无同步历史
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 冲突解决对话框 -->
    <BaseModal v-model="showConflictDialog" title="同步冲突" size="md">
      <div v-if="pendingConflict" class="conflict-content">
        <div class="conflict-info">
          <div class="conflict-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 class="conflict-title">检测到数据冲突</h3>
          <p class="conflict-description">
            本地数据和云端数据都有更新，请选择如何处理：
          </p>
        </div>

        <div class="conflict-options">
          <div class="conflict-option">
            <h4>使用本地数据</h4>
            <p>保留本地更改，覆盖云端数据</p>
            <BaseButton @click="resolveConflict('local')">
              使用本地
            </BaseButton>
          </div>

          <div class="conflict-option">
            <h4>使用云端数据</h4>
            <p>使用云端数据，丢弃本地更改</p>
            <BaseButton variant="secondary" @click="resolveConflict('remote')">
              使用云端
            </BaseButton>
          </div>

          <div class="conflict-option">
            <h4>智能合并</h4>
            <p>尝试自动合并两边的更改</p>
            <BaseButton variant="primary" @click="resolveConflict('merge')">
              智能合并
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSyncStore, SyncStatus } from '@/stores/syncStore'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { formatSyncTime } from '@/utils/syncUtils'

// Store
const syncStore = useSyncStore()

// 状态
const showConflictDialog = ref(false)
const showDebugInfo = ref(false)
const isTestingConnection = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const showTokenInput = ref(false)
const personalToken = ref('')
const isTokenAuthenticating = ref(false)

// 计算属性
const isAuthenticated = computed(() => syncStore.isAuthenticated)
const user = computed(() => syncStore.user)
const isSyncing = computed(() => syncStore.isSyncing)
const hasConflict = computed(() => syncStore.hasConflict)
const lastSyncFormatted = computed(() => syncStore.lastSyncFormatted)
const configGist = computed(() => syncStore.configGist)
const syncHistory = computed(() => syncStore.syncHistory)
const pendingConflict = computed(() => syncStore.pendingConflict)

const autoSyncEnabled = ref(syncStore.autoSyncEnabled)
const syncInterval = ref(syncStore.syncInterval)

const statusClass = computed(() => {
  switch (syncStore.status) {
    case SyncStatus.SUCCESS:
      return 'success'
    case SyncStatus.ERROR:
      return 'error'
    case SyncStatus.SYNCING:
      return 'syncing'
    case SyncStatus.CONFLICT:
      return 'conflict'
    default:
      return 'idle'
  }
})

const statusText = computed(() => {
  switch (syncStore.status) {
    case SyncStatus.SUCCESS:
      return '同步成功'
    case SyncStatus.ERROR:
      return '同步失败'
    case SyncStatus.SYNCING:
      return '同步中...'
    case SyncStatus.CONFLICT:
      return '存在冲突'
    default:
      return '就绪'
  }
})

const debugInfo = computed(() => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET

  return {
    clientId: clientId ? `${clientId.substring(0, 8)}...` : '未设置',
    callbackUrl: `${window.location.origin}/auth/github/callback`,
    envStatus: clientId && clientSecret ? '✅ 已配置' : '❌ 缺少配置',
    fullClientId: clientId,
    hasSecret: !!clientSecret,
  }
})

const configTest = computed(() => {
  if (!showDebugInfo.value) return null
  // Personal Access Token不需要复杂的配置测试
  return {
    isValid: true,
    errors: []
  }
})

// 方法

const handleLogout = () => {
  syncStore.logout()
}

const handleSync = async () => {
  try {
    await syncStore.sync()
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

const handleUpload = async () => {
  try {
    await syncStore.uploadConfig()
  } catch (error) {
    console.error('Upload failed:', error)
  }
}

const handleDownload = async () => {
  try {
    await syncStore.downloadConfig()
  } catch (error) {
    console.error('Download failed:', error)
  }
}

const handleAutoSyncChange = () => {
  syncStore.setAutoSync(autoSyncEnabled.value, syncInterval.value)
}

const handleIntervalChange = () => {
  syncStore.setAutoSync(autoSyncEnabled.value, syncInterval.value)
}

const resolveConflict = async (strategy: 'local' | 'remote' | 'merge') => {
  try {
    await syncStore.resolveConflict(strategy)
    showConflictDialog.value = false
  } catch (error) {
    console.error('Conflict resolution failed:', error)
  }
}

const clearHistory = () => {
  syncStore.clearSyncHistory()
}

const formatTime = (timestamp: string): string => {
  return formatSyncTime(timestamp)
}

const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value

  // 在控制台输出详细的调试信息
  if (showDebugInfo.value) {
    console.group('🔍 GitHub OAuth 调试信息')
    console.log('Client ID:', debugInfo.value.fullClientId || '未设置')
    console.log('Has Client Secret:', debugInfo.value.hasSecret)
    console.log('Callback URL:', debugInfo.value.callbackUrl)
    console.log('Environment Variables:')
    console.log('  VITE_GITHUB_CLIENT_ID:', import.meta.env.VITE_GITHUB_CLIENT_ID || '未设置')
    console.log('  VITE_GITHUB_CLIENT_SECRET:', import.meta.env.VITE_GITHUB_CLIENT_SECRET ? '已设置' : '未设置')
    console.log('Current URL:', window.location.href)
    console.groupEnd()
  }
}

const testGitHubConnection = async () => {
  isTestingConnection.value = true
  testResult.value = null

  try {
    console.group('🧪 测试GitHub连接')

    // 测试GitHub API连接
    console.log('测试GitHub API连接...')
    const response = await fetch('https://api.github.com/rate_limit')

    if (!response.ok) {
      throw new Error(`GitHub API连接失败: ${response.status} ${response.statusText}`)
    }

    const rateLimit = await response.json()
    console.log('GitHub API响应:', rateLimit)

    testResult.value = {
      success: true,
      message: '✅ GitHub API连接正常！可以使用Personal Access Token进行认证。'
    }

    console.log('✅ 连接测试通过')
    console.groupEnd()

  } catch (error) {
    console.error('❌ 测试失败:', error)
    console.groupEnd()

    testResult.value = {
      success: false,
      message: `❌ 连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  } finally {
    isTestingConnection.value = false
  }
}

const handleTokenAuth = async () => {
  if (!personalToken.value.trim()) return

  isTokenAuthenticating.value = true

  try {
    // 使用store的新方法进行认证
    await syncStore.loginWithToken(personalToken.value)

    // 清理输入
    personalToken.value = ''
    showTokenInput.value = false

    alert(`✅ 认证成功！`)

  } catch (error) {
    console.error('Token authentication failed:', error)
    alert(`❌ Token认证失败：\n\n${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    isTokenAuthenticating.value = false
  }
}

// 监听冲突状态
watch(hasConflict, (newValue) => {
  showConflictDialog.value = newValue
})

// 初始化
onMounted(async () => {
  await syncStore.initAuth()
})
</script>

<style scoped>
.sync-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sync-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .section-title {
  color: rgb(243 244 246);
}

/* 认证部分 */
.auth-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background-color: rgb(249 250 251);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
}

.dark .auth-section {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.auth-info {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.auth-icon {
  width: 48px;
  height: 48px;
  color: rgb(107 114 128);
  flex-shrink: 0;
}

.dark .auth-icon {
  color: rgb(156 163 175);
}

.auth-content {
  flex: 1;
}

.auth-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0 0 0.5rem 0;
}

.dark .auth-title {
  color: rgb(243 244 246);
}

.auth-description {
  color: rgb(107 114 128);
  margin: 0;
  line-height: 1.5;
}

.dark .auth-description {
  color: rgb(156 163 175);
}

.auth-help {
  margin-top: 0.75rem;
  padding: 1rem;
  background-color: rgb(254 242 242);
  border: 1px solid rgb(252 165 165);
  border-radius: 0.5rem;
}

.dark .auth-help {
  background-color: rgb(127 29 29);
  border-color: rgb(239 68 68);
}

.auth-help p {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(220 38 38);
}

.dark .auth-help p {
  color: rgb(248 113 113);
}

.help-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.help-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.help-button.primary {
  background-color: rgb(59 130 246);
  color: white;
}

.help-button.primary:hover {
  background-color: rgb(37 99 235);
}

.help-button.secondary {
  background-color: white;
  color: rgb(59 130 246);
  border: 1px solid rgb(59 130 246);
}

.dark .help-button.secondary {
  background-color: rgb(31 41 55);
  color: rgb(147 197 253);
  border-color: rgb(147 197 253);
}

.help-button.secondary:hover {
  background-color: rgb(59 130 246);
  color: white;
}

.help-link {
  color: rgb(37 99 235);
  text-decoration: none;
  font-weight: 500;
}

.help-link:hover {
  text-decoration: underline;
}

.dark .help-link {
  color: rgb(96 165 250);
}

.help-link-button {
  background: none;
  border: none;
  color: rgb(37 99 235);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
}

.help-link-button:hover {
  text-decoration: underline;
}

.dark .help-link-button {
  color: rgb(96 165 250);
}

/* Token输入区域 */
.token-input-section {
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgb(249 250 251);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
}

.dark .token-input-section {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.token-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0 0 0.5rem 0;
}

.dark .token-title {
  color: rgb(243 244 246);
}

.token-description {
  color: rgb(107 114 128);
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.dark .token-description {
  color: rgb(156 163 175);
}

.token-steps {
  margin-bottom: 1rem;
}

.token-steps ol {
  color: rgb(107 114 128);
  font-size: 0.875rem;
  line-height: 1.5;
  padding-left: 1.25rem;
}

.dark .token-steps ol {
  color: rgb(156 163 175);
}

.token-steps li {
  margin-bottom: 0.25rem;
}

.token-steps a {
  color: rgb(59 130 246);
  text-decoration: none;
}

.token-steps a:hover {
  text-decoration: underline;
}

.token-steps code {
  background-color: rgb(229 231 235);
  color: rgb(17 24 39);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.dark .token-steps code {
  background-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

.token-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.token-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.375rem;
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

.token-actions {
  display: flex;
  gap: 0.5rem;
}

.auth-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.auth-button {
  align-self: flex-start;
}

.debug-button {
  font-size: 0.75rem;
}

.debug-info {
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgb(249 250 251);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.dark .debug-info {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.debug-info h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17 24 39);
}

.dark .debug-info h5 {
  color: rgb(243 244 246);
}

.debug-info p {
  margin: 0.25rem 0;
  color: rgb(107 114 128);
}

.dark .debug-info p {
  color: rgb(156 163 175);
}

.config-test,
.connection-test {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgb(229 231 235);
}

.dark .config-test,
.dark .connection-test {
  border-color: rgb(75 85 99);
}

.config-test h6 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(17 24 39);
}

.dark .config-test h6 {
  color: rgb(243 244 246);
}

.test-success {
  padding: 0.5rem;
  background-color: rgb(240 253 244);
  color: rgb(22 163 74);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.dark .test-success {
  background-color: rgb(20 83 45);
  color: rgb(134 239 172);
}

.test-errors {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.error-item {
  padding: 0.5rem;
  background-color: rgb(254 242 242);
  color: rgb(220 38 38);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.dark .error-item {
  background-color: rgb(127 29 29);
  color: rgb(248 113 113);
}

.button-icon {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}

/* 已连接状态 */
.connected-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: rgb(249 250 251);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
}

.dark .user-info {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: rgb(17 24 39);
}

.dark .user-name {
  color: rgb(243 244 246);
}

.user-login {
  font-size: 0.875rem;
  color: rgb(107 114 128);
}

.dark .user-login {
  color: rgb(156 163 175);
}

/* 同步状态 */
.sync-status {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
}

.dark .sync-status {
  border-color: rgb(75 85 99);
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgb(156 163 175);
}

.status-indicator.success .status-dot {
  background-color: rgb(34 197 94);
}

.status-indicator.error .status-dot {
  background-color: rgb(239 68 68);
}

.status-indicator.syncing .status-dot {
  background-color: rgb(59 130 246);
  animation: pulse 2s infinite;
}

.status-indicator.conflict .status-dot {
  background-color: rgb(245 158 11);
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(17 24 39);
}

.dark .status-text {
  color: rgb(243 244 246);
}

.last-sync {
  font-size: 0.75rem;
  color: rgb(107 114 128);
}

.dark .last-sync {
  color: rgb(156 163 175);
}

.sync-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* 自动同步设置 */
.auto-sync-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
}

.dark .auto-sync-settings {
  border-color: rgb(75 85 99);
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgb(17 24 39);
  cursor: pointer;
}

.dark .setting-label {
  color: rgb(243 244 246);
}

.setting-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: rgb(59 130 246);
}

.setting-select {
  padding: 0.5rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.375rem;
  background-color: white;
  color: rgb(17 24 39);
  font-size: 0.875rem;
}

.dark .setting-select {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

/* 同步历史 */
.sync-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .history-title {
  color: rgb(243 244 246);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: rgb(249 250 251);
  border-radius: 0.375rem;
}

.dark .history-item {
  background-color: rgb(55 65 81);
}

.history-status {
  display: flex;
  align-items: center;
  padding-top: 0.125rem;
}

.history-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgb(156 163 175);
}

.history-status.success .history-dot {
  background-color: rgb(34 197 94);
}

.history-status.error .history-dot {
  background-color: rgb(239 68 68);
}

.history-content {
  flex: 1;
}

.history-message {
  font-size: 0.875rem;
  color: rgb(17 24 39);
  margin-bottom: 0.25rem;
}

.dark .history-message {
  color: rgb(243 244 246);
}

.history-time {
  font-size: 0.75rem;
  color: rgb(107 114 128);
  margin-bottom: 0.25rem;
}

.dark .history-time {
  color: rgb(156 163 175);
}

.history-changes {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.history-changes span {
  padding: 0.125rem 0.375rem;
  background-color: rgb(239 246 255);
  color: rgb(59 130 246);
  border-radius: 0.25rem;
  font-size: 0.625rem;
}

.dark .history-changes span {
  background-color: rgb(30 58 138);
  color: rgb(147 197 253);
}

.history-empty {
  text-align: center;
  padding: 2rem;
  color: rgb(107 114 128);
  font-size: 0.875rem;
}

.dark .history-empty {
  color: rgb(156 163 175);
}

/* 冲突对话框 */
.conflict-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.conflict-info {
  text-align: center;
}

.conflict-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: rgb(245 158 11);
}

.conflict-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0 0 0.5rem 0;
}

.dark .conflict-title {
  color: rgb(243 244 246);
}

.conflict-description {
  color: rgb(107 114 128);
  margin: 0;
  line-height: 1.5;
}

.dark .conflict-description {
  color: rgb(156 163 175);
}

.conflict-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.conflict-option {
  padding: 1rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  text-align: center;
}

.dark .conflict-option {
  border-color: rgb(75 85 99);
}

.conflict-option h4 {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0 0 0.5rem 0;
}

.dark .conflict-option h4 {
  color: rgb(243 244 246);
}

.conflict-option p {
  color: rgb(107 114 128);
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
}

.dark .conflict-option p {
  color: rgb(156 163 175);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .auth-info {
    flex-direction: column;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
    text-align: center;
  }

  .status-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .sync-actions {
    justify-content: center;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .conflict-options {
    gap: 0.75rem;
  }
}
</style>
