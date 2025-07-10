<template>
  <div class="page-container">
    <div class="container">
      <!-- 头部 -->
      <div class="header">
        <h1 class="title">
          Echo Nav
        </h1>
        <p class="subtitle">
          现代化个人导航主页 - UI组件展示
        </p>

        <!-- 主题切换按钮 -->
        <BaseButton @click="toggleTheme" variant="outline" size="sm">
          {{ getThemeIcon() }} {{ getThemeLabel() }}
        </BaseButton>
      </div>

      <!-- 组件展示区域 -->
      <div class="content-area">
        <!-- 按钮组件展示 -->
        <BaseCard>
          <template #header>
            <h2 class="text-xl font-semibold">按钮组件 (BaseButton)</h2>
          </template>

          <div class="demo-section">
            <!-- 不同变体 -->
            <div>
              <h3 class="demo-title">变体</h3>
              <div class="button-group">
                <BaseButton variant="primary">Primary</BaseButton>
                <BaseButton variant="secondary">Secondary</BaseButton>
                <BaseButton variant="outline">Outline</BaseButton>
                <BaseButton variant="ghost">Ghost</BaseButton>
              </div>
            </div>

            <!-- 不同尺寸 -->
            <div>
              <h3 class="demo-title">尺寸</h3>
              <div class="button-group">
                <BaseButton size="sm">Small</BaseButton>
                <BaseButton size="md">Medium</BaseButton>
                <BaseButton size="lg">Large</BaseButton>
              </div>
            </div>

            <!-- 状态 -->
            <div>
              <h3 class="demo-title">状态</h3>
              <div class="button-group">
                <BaseButton :loading="true">Loading</BaseButton>
                <BaseButton :disabled="true">Disabled</BaseButton>
                <BaseButton block>Block Button</BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- 输入框组件展示 -->
        <BaseCard>
          <template #header>
            <h2 class="text-xl font-semibold">输入框组件 (BaseInput)</h2>
          </template>

          <div class="input-demo">
            <BaseInput v-model="inputValue" label="基础输入框" placeholder="请输入内容..." clearable />

            <BaseInput v-model="emailValue" type="email" label="邮箱地址" placeholder="example@email.com" state="success"
              message="邮箱格式正确" required />

            <BaseInput v-model="errorValue" label="错误状态" placeholder="输入内容..." state="error" message="这是一个错误提示" />

            <BaseInput label="禁用状态" placeholder="禁用的输入框" disabled />
          </div>
        </BaseCard>

        <!-- 数据管理展示 -->
        <BaseCard>
          <template #header>
            <h2 class="text-xl font-semibold">数据管理 (Pinia Stores)</h2>
          </template>

          <div class="demo-section">
            <!-- 统计信息 -->
            <div>
              <h3 class="demo-title">数据统计</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">网站总数</span>
                  <span class="stat-value">{{ websiteStats.totalWebsites }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">分类总数</span>
                  <span class="stat-value">{{ websiteStats.totalCategories }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">标签总数</span>
                  <span class="stat-value">{{ websiteStats.totalTags }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">收藏数量</span>
                  <span class="stat-value">{{ websiteStats.favoriteCount }}</span>
                </div>
              </div>
            </div>

            <!-- 网站列表 -->
            <div>
              <h3 class="demo-title">网站列表</h3>
              <div class="website-list">
                <div v-for="website in allWebsites" :key="website.id" class="website-item">
                  <div class="website-info">
                    <h4 class="website-name">{{ website.name }}</h4>
                    <p class="website-url">{{ website.url }}</p>
                    <div class="website-meta">
                      <span v-if="website.isFavorite" class="favorite-badge">⭐ 收藏</span>
                      <span class="visit-count">访问 {{ website.visitCount }} 次</span>
                    </div>
                  </div>
                  <div class="website-actions">
                    <BaseButton size="sm" @click="websiteStore.toggleFavorite(website.id)">
                      {{ website.isFavorite ? '取消收藏' : '收藏' }}
                    </BaseButton>
                    <BaseButton size="sm" variant="secondary" @click="websiteStore.visitWebsite(website.id)">
                      访问
                    </BaseButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- 添加网站 -->
            <div>
              <h3 class="demo-title">添加网站</h3>
              <BaseButton @click="showAddWebsiteModal = true">
                添加新网站
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <!-- 卡片组件展示 -->
        <BaseCard>
          <template #header>
            <h2 class="text-xl font-semibold">卡片组件 (BaseCard)</h2>
          </template>

          <div class="card-grid">
            <BaseCard variant="default" hoverable>
              <h3 class="card-title">默认卡片</h3>
              <p class="card-text">这是一个默认样式的卡片，支持悬停效果。</p>
            </BaseCard>

            <BaseCard variant="bordered" clickable @click="showModal = true">
              <h3 class="card-title">边框卡片</h3>
              <p class="card-text">这是一个带边框的可点击卡片，点击打开模态框。</p>
            </BaseCard>

            <BaseCard variant="shadow" padding="lg">
              <h3 class="card-title">阴影卡片</h3>
              <p class="card-text">这是一个带阴影的卡片，使用大内边距。</p>
            </BaseCard>

            <BaseCard variant="elevated">
              <template #header>
                <h3 class="card-title">带头部的卡片</h3>
              </template>
              <p class="card-text">这个卡片有头部区域。</p>
              <template #footer>
                <div class="card-footer">
                  <BaseButton size="sm">操作</BaseButton>
                </div>
              </template>
            </BaseCard>
          </div>
        </BaseCard>
      </div>

      <!-- 模态框展示 -->
      <BaseModal v-model="showModal" title="模态框示例" size="md">
        <div class="modal-content">
          <p class="modal-text">
            这是一个模态框示例，展示了BaseModal组件的基本功能。
          </p>

          <BaseInput v-model="modalInput" label="模态框中的输入" placeholder="在模态框中输入..." />
        </div>

        <template #footer>
          <div class="modal-footer">
            <BaseButton variant="secondary" @click="showModal = false">
              取消
            </BaseButton>
            <BaseButton @click="showModal = false">
              确定
            </BaseButton>
          </div>
        </template>
      </BaseModal>

      <!-- 添加网站模态框 -->
      <BaseModal v-model="showAddWebsiteModal" title="添加新网站" size="md">
        <div class="modal-content">
          <BaseInput v-model="newWebsite.name" label="网站名称" placeholder="请输入网站名称..." required />

          <BaseInput v-model="newWebsite.url" label="网站URL" placeholder="https://example.com" required />

          <BaseInput v-model="newWebsite.description" label="描述" placeholder="网站描述（可选）" />

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input v-model="newWebsite.isFavorite" type="checkbox" class="checkbox" />
              <span>添加到收藏</span>
            </label>
          </div>
        </div>

        <template #footer>
          <div class="modal-footer">
            <BaseButton variant="secondary" @click="showAddWebsiteModal = false">
              取消
            </BaseButton>
            <BaseButton @click="addWebsite">
              添加网站
            </BaseButton>
          </div>
        </template>
      </BaseModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useWebsiteStore } from '@/stores/websiteStore'
import { useSettingsStore } from '@/stores/settingsStore'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

// 主题管理
const { toggleTheme, getThemeLabel, getThemeIcon } = useTheme()

// 数据管理
const websiteStore = useWebsiteStore()
const settingsStore = useSettingsStore()

// 响应式数据
const inputValue = ref('')
const emailValue = ref('')
const errorValue = ref('')
const showModal = ref(false)
const modalInput = ref('')

// 新增网站表单
const showAddWebsiteModal = ref(false)
const newWebsite = ref({
  name: '',
  url: '',
  description: '',
  categoryId: '',
  tags: [] as string[],
  isFavorite: false,
})

// 计算属性
const websiteStats = computed(() => websiteStore.stats)
const allWebsites = computed(() => websiteStore.websites)
const allCategories = computed(() => websiteStore.categories)

// 添加网站
const addWebsite = async () => {
  try {
    await websiteStore.createWebsite({
      name: newWebsite.value.name,
      url: newWebsite.value.url,
      description: newWebsite.value.description,
      categoryId: newWebsite.value.categoryId || undefined,
      tags: newWebsite.value.tags,
      isFavorite: newWebsite.value.isFavorite,
    })

    // 重置表单
    newWebsite.value = {
      name: '',
      url: '',
      description: '',
      categoryId: '',
      tags: [],
      isFavorite: false,
    }

    showAddWebsiteModal.value = false
  } catch (error) {
    console.error('添加网站失败:', error)
  }
}
</script>

<style scoped>
/* 页面容器 */
.page-container {
  min-height: 100vh;
  background-color: rgb(249 250 251);
  transition: background-color 300ms, color 300ms;
}

.dark .page-container {
  background-color: rgb(17 24 39);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* 头部样式 */
.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.25rem;
  font-weight: bold;
  color: rgb(17 24 39);
  margin-bottom: 1rem;
}

.dark .title {
  color: white;
}

.subtitle {
  font-size: 1.125rem;
  color: rgb(75 85 99);
  margin-bottom: 1.5rem;
}

.dark .subtitle {
  color: rgb(209 213 219);
}

/* 内容区域 */
.content-area {
  max-width: 64rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 演示区域 */
.demo-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(55 65 81);
  margin-bottom: 0.5rem;
}

.dark .demo-title {
  color: rgb(209 213 219);
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

/* 输入框演示 */
.input-demo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 28rem;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.card-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: rgb(17 24 39);
}

.dark .card-title {
  color: rgb(243 244 246);
}

.card-text {
  color: rgb(75 85 99);
  line-height: 1.5;
}

.dark .card-text {
  color: rgb(209 213 219);
}

.card-footer {
  text-align: right;
}

/* 模态框内容 */
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-text {
  color: rgb(75 85 99);
  line-height: 1.5;
}

.dark .modal-text {
  color: rgb(209 213 219);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 数据管理样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: rgb(249 250 251);
  border-radius: 0.5rem;
  border: 1px solid rgb(229 231 235);
}

.dark .stat-item {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(107 114 128);
  margin-bottom: 0.25rem;
}

.dark .stat-label {
  color: rgb(156 163 175);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: rgb(17 24 39);
}

.dark .stat-value {
  color: rgb(243 244 246);
}

.website-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.website-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgb(249 250 251);
  border-radius: 0.5rem;
  border: 1px solid rgb(229 231 235);
}

.dark .website-item {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.website-info {
  flex: 1;
}

.website-name {
  font-weight: 600;
  color: rgb(17 24 39);
  margin-bottom: 0.25rem;
}

.dark .website-name {
  color: rgb(243 244 246);
}

.website-url {
  font-size: 0.875rem;
  color: rgb(107 114 128);
  margin-bottom: 0.5rem;
}

.dark .website-url {
  color: rgb(156 163 175);
}

.website-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.favorite-badge {
  color: rgb(245 158 11);
  font-weight: 500;
}

.visit-count {
  color: rgb(107 114 128);
}

.dark .visit-count {
  color: rgb(156 163 175);
}

.website-actions {
  display: flex;
  gap: 0.5rem;
}

.checkbox-group {
  margin-top: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: rgb(17 24 39);
}

.dark .checkbox-label {
  color: rgb(243 244 246);
}

.checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: rgb(59 130 246);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .container {
    padding: 1rem 0.5rem;
  }

  .title {
    font-size: 1.875rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .content-area {
    gap: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .website-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .website-actions {
    align-self: stretch;
    justify-content: flex-end;
  }
}
</style>
