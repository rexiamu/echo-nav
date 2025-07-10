<template>
  <div class="callback-view">
    <div class="callback-container">
      <div class="callback-content">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner">
            <svg class="spinner" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="32" stroke-dashoffset="32">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <h2 class="loading-title">正在处理GitHub认证...</h2>
          <p class="loading-description">请稍候，我们正在验证您的GitHub账户。</p>
        </div>

        <div v-else-if="hasError" class="error-state">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 class="error-title">认证失败</h2>
          <p class="error-description">{{ errorMessage }}</p>
          <div class="error-actions">
            <button class="retry-btn" @click="handleRetry">
              重试
            </button>
            <button class="back-btn" @click="handleGoBack">
              返回首页
            </button>
          </div>
        </div>

        <div v-else class="success-state">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 class="success-title">认证成功！</h2>
          <p class="success-description">您的GitHub账户已成功连接，正在跳转回主页...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { githubAuth } from '@/services/githubAuth'

// Router
const router = useRouter()
const route = useRoute()

// 状态
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')

// 方法
const handleCallback = async () => {
  try {
    const code = route.query.code as string
    const state = route.query.state as string
    const error = route.query.error as string

    // 检查是否有错误
    if (error) {
      throw new Error(`GitHub认证被拒绝: ${error}`)
    }

    // 检查是否有授权码
    if (!code) {
      throw new Error('未收到GitHub授权码')
    }

    // 处理OAuth回调
    await githubAuth.handleCallback(code, state)

    // 认证成功
    isLoading.value = false
    
    // 延迟跳转，让用户看到成功信息
    setTimeout(() => {
      router.push('/')
    }, 2000)

  } catch (error) {
    console.error('GitHub callback handling failed:', error)
    
    isLoading.value = false
    hasError.value = true
    
    if (error instanceof Error) {
      errorMessage.value = error.message
    } else {
      errorMessage.value = '认证过程中发生未知错误'
    }
  }
}

const handleRetry = () => {
  // 重新开始认证流程
  try {
    githubAuth.startOAuth()
  } catch (error) {
    console.error('Failed to start OAuth:', error)
    handleGoBack()
  }
}

const handleGoBack = () => {
  router.push('/')
}

// 生命周期
onMounted(() => {
  handleCallback()
})
</script>

<style scoped>
.callback-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(249 250 251);
  padding: 1rem;
}

.dark .callback-view {
  background-color: rgb(17 24 39);
}

.callback-container {
  max-width: 400px;
  width: 100%;
}

.callback-content {
  background-color: white;
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.dark .callback-content {
  background-color: rgb(31 41 55);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  color: rgb(59 130 246);
}

.spinner {
  width: 100%;
  height: 100%;
}

.loading-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .loading-title {
  color: rgb(243 244 246);
}

.loading-description {
  color: rgb(107 114 128);
  margin: 0;
  line-height: 1.5;
}

.dark .loading-description {
  color: rgb(156 163 175);
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: rgb(239 68 68);
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .error-title {
  color: rgb(243 244 246);
}

.error-description {
  color: rgb(107 114 128);
  margin: 0;
  line-height: 1.5;
}

.dark .error-description {
  color: rgb(156 163 175);
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.retry-btn,
.back-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: 1px solid transparent;
}

.retry-btn {
  background-color: rgb(59 130 246);
  color: white;
}

.retry-btn:hover {
  background-color: rgb(37 99 235);
}

.back-btn {
  background-color: transparent;
  color: rgb(107 114 128);
  border-color: rgb(229 231 235);
}

.dark .back-btn {
  color: rgb(156 163 175);
  border-color: rgb(75 85 99);
}

.back-btn:hover {
  background-color: rgb(249 250 251);
  color: rgb(17 24 39);
}

.dark .back-btn:hover {
  background-color: rgb(55 65 81);
  color: rgb(243 244 246);
}

/* 成功状态 */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.success-icon {
  width: 48px;
  height: 48px;
  color: rgb(34 197 94);
}

.success-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .success-title {
  color: rgb(243 244 246);
}

.success-description {
  color: rgb(107 114 128);
  margin: 0;
  line-height: 1.5;
}

.dark .success-description {
  color: rgb(156 163 175);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .callback-content {
    padding: 1.5rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .retry-btn,
  .back-btn {
    width: 100%;
  }
}
</style>
