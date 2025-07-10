import './assets/css/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Main',
      component: () => import('./views/MainView.vue'),
    },
    {
      path: '/demo',
      name: 'Demo',
      component: () => import('./views/HomeView.vue'),
    },
    {
      path: '/auth/github/callback',
      name: 'GitHubCallback',
      component: () => import('./views/GitHubCallbackView.vue'),
    },
    {
      path: '/github-test',
      name: 'GitHubTest',
      component: () => import('./views/GitHubTestView.vue'),
    },
    {
      path: '/github-auth-help',
      name: 'GitHubAuthHelp',
      component: () => import('./views/GitHubAuthHelpView.vue'),
    },
  ],
})

// 创建应用实例
const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)

// 初始化stores（在挂载前）
import { useWebsiteStore } from './stores/websiteStore'
import { useSettingsStore } from './stores/settingsStore'

const websiteStore = useWebsiteStore()
const settingsStore = useSettingsStore()

// 初始化数据
websiteStore.initializeData()
settingsStore.initializeSettings()

// 挂载应用
app.mount('#app')

// 注册Service Worker (PWA支持)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration)

        // 检查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新版本可用，提示用户刷新
                if (confirm('发现新版本，是否立即更新？')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                }
              }
            })
          }
        })
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// 初始化主题（在DOM挂载后）
import { applyThemeOnMount } from './composables/useTheme'
applyThemeOnMount()
