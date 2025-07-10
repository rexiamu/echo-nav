import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@/composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
      '@/stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@/services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
  build: {
    // 生产环境构建优化
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          utils: ['@vueuse/core'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 资源压缩
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  // 预览服务器配置
  preview: {
    port: 4173,
    open: true,
  },
})
