// Service Worker for Echo Nav PWA
const CACHE_NAME = 'echo-nav-v1'
const STATIC_CACHE_NAME = 'echo-nav-static-v1'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon.svg'
]

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return
  }
  
  // 对于导航请求，使用网络优先策略
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 如果网络请求成功，缓存响应
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          // 网络失败时，尝试从缓存获取
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // 如果缓存中也没有，返回离线页面
              return caches.match('/')
            })
        })
    )
    return
  }
  
  // 对于静态资源，使用缓存优先策略
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone)
                  })
              }
              return response
            })
        })
    )
    return
  }
  
  // 对于API请求，使用网络优先策略
  if (request.url.includes('/api/') || request.url.includes('github.com')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // API请求失败时，可以返回默认响应或从缓存获取
          return new Response(
            JSON.stringify({ error: 'Network unavailable' }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          )
        })
    )
    return
  }
})

// 处理消息事件
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// 处理推送通知（可选功能）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: '查看详情',
          icon: '/icon-192.png'
        },
        {
          action: 'close',
          title: '关闭',
          icon: '/icon-192.png'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// 处理通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
