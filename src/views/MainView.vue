<template>
  <div class="main-view">
    <!-- 应用头部 -->
    <AppHeader :current-view="currentView" @search="handleSearch" @view-change="handleViewChange"
      @add-website="showAddWebsiteModal = true" @open-settings="showSettingsModal = true" />

    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="content-container">
        <!-- 分类导航 -->
        <div v-if="showCategories && categories.length > 0" class="category-nav">
          <button v-for="category in categories" :key="category.id"
            :class="['category-btn', { active: selectedCategoryId === category.id }]"
            @click="selectCategory(category.id)">
            <span v-if="category.icon" class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">({{ getCategoryWebsiteCount(category.id) }})</span>
          </button>
          <button :class="['category-btn', { active: selectedCategoryId === null }]" @click="selectCategory(null)">
            <span class="category-name">全部</span>
            <span class="category-count">({{ websiteStore.websiteCount }})</span>
          </button>
        </div>

        <!-- 网站网格 -->
        <WebsiteGrid :websites="filteredWebsites" :is-loading="isLoading" :card-size="cardSize" :columns="gridColumns"
          :show-descriptions="showDescriptions" :show-actions="true" :show-visit-count="true" :clickable="true"
          @card-click="handleWebsiteClick" @favorite="handleToggleFavorite" @visit="handleVisitWebsite"
          @add-website="showAddWebsiteModal = true" />
      </div>
    </main>

    <!-- 添加网站模态框 -->
    <AddWebsiteModal v-model="showAddWebsiteModal" @success="handleAddSuccess" @error="handleError" />

    <!-- 编辑网站模态框 -->
    <EditWebsiteModal v-model="showEditWebsiteModal" :website="editingWebsite" @success="handleEditSuccess"
      @deleted="handleDeleteSuccess" @error="handleError" />

    <!-- 全局搜索模态框 -->
    <SearchModal ref="searchModal" />

    <!-- 设置模态框 -->
    <BaseModal v-model="showSettingsModal" title="设置" size="xl">
      <div class="settings-content">
        <div class="settings-section">
          <h3 class="settings-title">布局设置</h3>
          <div class="settings-group">
            <label class="settings-label">卡片大小</label>
            <div class="radio-group">
              <label v-for="size in cardSizeOptions" :key="size.value" class="radio-label">
                <input v-model="cardSize" type="radio" :value="size.value" class="radio" />
                <span>{{ size.label }}</span>
              </label>
            </div>
          </div>

          <div class="settings-group">
            <label class="checkbox-label">
              <input v-model="showDescriptions" type="checkbox" class="checkbox" />
              <span>显示网站描述</span>
            </label>
          </div>

          <div class="settings-group">
            <label class="checkbox-label">
              <input v-model="showCategories" type="checkbox" class="checkbox" />
              <span>显示分类导航</span>
            </label>
          </div>
        </div>

        <!-- 分类管理 -->
        <div class="settings-section">
          <CategoryManager />
        </div>

        <!-- GitHub同步 -->
        <div class="settings-section">
          <SyncSettings />
        </div>
      </div>

      <template #footer>
        <div class="modal-footer">
          <BaseButton variant="secondary" @click="showSettingsModal = false">
            关闭
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWebsiteStore } from '@/stores/websiteStore'
import AppHeader from '@/components/layout/AppHeader.vue'
import WebsiteGrid from '@/components/features/WebsiteGrid.vue'
import AddWebsiteModal from '@/components/features/AddWebsiteModal.vue'
import EditWebsiteModal from '@/components/features/EditWebsiteModal.vue'
import SearchModal from '@/components/features/SearchModal.vue'
import CategoryManager from '@/components/features/CategoryManager.vue'
import SyncSettings from '@/components/features/SyncSettings.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import type { Website } from '@/types/website'

// Stores
const websiteStore = useWebsiteStore()

// 状态
const isLoading = ref(false)
const searchQuery = ref('')
const currentView = ref<'grid' | 'list' | 'compact'>('grid')
const selectedCategoryId = ref<string | null>(null)
const showAddWebsiteModal = ref(false)
const showEditWebsiteModal = ref(false)
const showSettingsModal = ref(false)
const editingWebsite = ref<Website | undefined>()
const searchModal = ref<InstanceType<typeof SearchModal>>()

// 设置
const cardSize = ref<'sm' | 'md' | 'lg'>('md')
const showDescriptions = ref(true)
const showCategories = ref(true)

// 删除了newWebsite，现在使用AddWebsiteModal组件

// 计算属性
const websites = computed(() => websiteStore.websites)
const categories = computed(() => websiteStore.categories)

const filteredWebsites = computed(() => {
  // 创建深度可变副本
  let filtered = websites.value.map(w => ({
    ...w,
    tags: [...w.tags]
  }))

  // 按分类过滤
  if (selectedCategoryId.value) {
    filtered = filtered.filter(w => w.categoryId === selectedCategoryId.value)
  }

  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(w =>
      w.name.toLowerCase().includes(query) ||
      w.description?.toLowerCase().includes(query) ||
      w.url.toLowerCase().includes(query) ||
      w.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return filtered
})

const gridColumns = computed(() => {
  switch (currentView.value) {
    case 'list':
      return 1
    case 'compact':
      return 'auto'
    default:
      return 'auto'
  }
})

const cardSizeOptions = [
  { value: 'sm', label: '小' },
  { value: 'md', label: '中' },
  { value: 'lg', label: '大' },
]

// 方法
const handleSearch = (query: string) => {
  searchQuery.value = query
}

const handleViewChange = (view: 'grid' | 'list' | 'compact') => {
  currentView.value = view
}

const selectCategory = (categoryId: string | null) => {
  selectedCategoryId.value = categoryId
}

const getCategoryWebsiteCount = (categoryId: string) => {
  return websites.value.filter(w => w.categoryId === categoryId).length
}

const handleWebsiteClick = (website: Website) => {
  // 打开编辑模态框
  editingWebsite.value = website
  showEditWebsiteModal.value = true
}

const handleToggleFavorite = (website: Website) => {
  websiteStore.toggleFavorite(website.id)
}

const handleVisitWebsite = (website: Website) => {
  websiteStore.visitWebsite(website.id)
}

const handleAddSuccess = (website: Website) => {
  console.log('网站添加成功:', website.name)
  // 可以在这里添加成功提示
}

const handleEditSuccess = (website: Website) => {
  console.log('网站更新成功:', website.name)
  editingWebsite.value = undefined
  // 可以在这里添加成功提示
}

const handleDeleteSuccess = (websiteId: string) => {
  console.log('网站删除成功:', websiteId)
  editingWebsite.value = undefined
  // 可以在这里添加成功提示
}

const handleError = (error: string) => {
  console.error('操作失败:', error)
  // 可以在这里添加错误提示
}

// 初始化
onMounted(() => {
  // 数据已经在main.ts中初始化了
})
</script>

<style scoped>
.main-view {
  min-height: 100vh;
  background-color: rgb(249 250 251);
}

.dark .main-view {
  background-color: rgb(17 24 39);
}

.main-content {
  padding: 2rem 0;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 分类导航 */
.category-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: white;
  border-radius: 0.75rem;
  border: 1px solid rgb(229 231 235);
}

.dark .category-nav {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
}

.category-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: rgb(249 250 251);
  color: rgb(107 114 128);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.dark .category-btn {
  background-color: rgb(55 65 81);
  color: rgb(156 163 175);
  border-color: rgb(75 85 99);
}

.category-btn:hover {
  background-color: rgb(59 130 246);
  color: white;
  border-color: rgb(59 130 246);
}

.category-btn.active {
  background-color: rgb(59 130 246);
  color: white;
  border-color: rgb(59 130 246);
}

.category-icon {
  font-size: 1rem;
}

.category-name {
  font-weight: 500;
}

.category-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* 表单样式 */
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(17 24 39);
}

.dark .form-label {
  color: rgb(243 244 246);
}

.form-select {
  padding: 0.75rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  background-color: white;
  color: rgb(17 24 39);
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;
}

.dark .form-select {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

.form-select:focus {
  outline: none;
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* 设置样式 */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.settings-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .settings-title {
  color: rgb(243 244 246);
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(17 24 39);
}

.dark .settings-label {
  color: rgb(243 244 246);
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: rgb(17 24 39);
}

.dark .radio-label {
  color: rgb(243 244 246);
}

.radio {
  width: 1rem;
  height: 1rem;
  accent-color: rgb(59 130 246);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem 0;
  }

  .content-container {
    padding: 0 0.5rem;
  }

  .category-nav {
    padding: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .category-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }

  .radio-group {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
