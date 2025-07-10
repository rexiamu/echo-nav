<template>
  <div class="category-manager">
    <!-- 头部 -->
    <div class="manager-header">
      <h3 class="manager-title">分类管理</h3>
      <BaseButton size="sm" @click="showAddForm = true">
        <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        添加分类
      </BaseButton>
    </div>

    <!-- 分类列表 -->
    <div class="category-list">
      <div v-for="category in categories" :key="category.id" class="category-item"
        :class="{ editing: editingId === category.id }">
        <!-- 编辑模式 -->
        <div v-if="editingId === category.id" class="category-edit">
          <div class="edit-form">
            <div class="form-row">
              <input v-model="editForm.name" type="text" placeholder="分类名称" class="edit-input" @keydown.enter="saveEdit"
                @keydown.escape="cancelEdit" />
              <input v-model="editForm.icon" type="text" placeholder="图标 (emoji)" class="edit-input icon-input"
                @keydown.enter="saveEdit" @keydown.escape="cancelEdit" />
            </div>
            <div class="form-row">
              <input v-model="editForm.description" type="text" placeholder="描述（可选）" class="edit-input"
                @keydown.enter="saveEdit" @keydown.escape="cancelEdit" />
              <input v-model="editForm.color" type="color" class="edit-color" @change="saveEdit" />
            </div>
          </div>
          <div class="edit-actions">
            <button class="action-btn save" @click="saveEdit" :disabled="!editForm.name.trim()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </button>
            <button class="action-btn cancel" @click="cancelEdit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 显示模式 -->
        <div v-else class="category-display">
          <div class="category-info">
            <div class="category-main">
              <span v-if="category.icon" class="category-icon">{{ category.icon }}</span>
              <div class="category-details">
                <div class="category-name">{{ category.name }}</div>
                <div v-if="category.description" class="category-description">
                  {{ category.description }}
                </div>
              </div>
              <div class="category-count">
                {{ getCategoryWebsiteCount(category.id) }} 个网站
              </div>
            </div>
            <div v-if="category.color" class="category-color" :style="{ backgroundColor: category.color }"></div>
          </div>
          <div class="category-actions">
            <button class="action-btn edit" @click="startEdit(category)" title="编辑">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button class="action-btn delete" @click="deleteCategory(category)" title="删除">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 添加分类表单 -->
      <div v-if="showAddForm" class="category-item adding">
        <div class="category-edit">
          <div class="edit-form">
            <div class="form-row">
              <input v-model="addForm.name" type="text" placeholder="分类名称" class="edit-input"
                @keydown.enter="addCategory" @keydown.escape="cancelAdd" ref="addNameInput" />
              <input v-model="addForm.icon" type="text" placeholder="图标 (emoji)" class="edit-input icon-input"
                @keydown.enter="addCategory" @keydown.escape="cancelAdd" />
            </div>
            <div class="form-row">
              <input v-model="addForm.description" type="text" placeholder="描述（可选）" class="edit-input"
                @keydown.enter="addCategory" @keydown.escape="cancelAdd" />
              <input v-model="addForm.color" type="color" class="edit-color" value="#3B82F6" />
            </div>
          </div>
          <div class="edit-actions">
            <button class="action-btn save" @click="addCategory" :disabled="!addForm.name.trim()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </button>
            <button class="action-btn cancel" @click="cancelAdd">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="categories.length === 0 && !showAddForm" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      </div>
      <p class="empty-text">还没有创建任何分类</p>
      <BaseButton @click="showAddForm = true">创建第一个分类</BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useWebsiteStore } from '@/stores/websiteStore'
import BaseButton from '@/components/ui/BaseButton.vue'
import type { Category } from '@/types/website'

// Store
const websiteStore = useWebsiteStore()

// 状态
const showAddForm = ref(false)
const editingId = ref<string | null>(null)
const addNameInput = ref<HTMLInputElement>()

const addForm = ref({
  name: '',
  icon: '',
  description: '',
  color: '#3B82F6',
})

const editForm = ref({
  name: '',
  icon: '',
  description: '',
  color: '',
})

// 计算属性
const categories = computed(() => websiteStore.categories)

// 方法
const getCategoryWebsiteCount = (categoryId: string) => {
  return websiteStore.websites.filter(w => w.categoryId === categoryId).length
}

const startEdit = (category: Category) => {
  editingId.value = category.id
  editForm.value = {
    name: category.name,
    icon: category.icon || '',
    description: category.description || '',
    color: category.color || '#3B82F6',
  }
}

const saveEdit = async () => {
  if (!editingId.value || !editForm.value.name.trim()) return

  try {
    await websiteStore.updateCategory(editingId.value, {
      name: editForm.value.name.trim(),
      icon: editForm.value.icon.trim() || undefined,
      description: editForm.value.description.trim() || undefined,
      color: editForm.value.color,
    })

    editingId.value = null
  } catch (error) {
    console.error('更新分类失败:', error)
  }
}

const cancelEdit = () => {
  editingId.value = null
}

const addCategory = async () => {
  if (!addForm.value.name.trim()) return

  try {
    await websiteStore.createCategory({
      name: addForm.value.name.trim(),
      icon: addForm.value.icon.trim() || undefined,
      description: addForm.value.description.trim() || undefined,
      color: addForm.value.color,
    })

    // 重置表单
    addForm.value = {
      name: '',
      icon: '',
      description: '',
      color: '#3B82F6',
    }
    showAddForm.value = false
  } catch (error) {
    console.error('添加分类失败:', error)
  }
}

const cancelAdd = () => {
  addForm.value = {
    name: '',
    icon: '',
    description: '',
    color: '#3B82F6',
  }
  showAddForm.value = false
}

const deleteCategory = async (category: Category) => {
  const websiteCount = getCategoryWebsiteCount(category.id)

  let confirmMessage = `确定要删除分类 "${category.name}" 吗？`
  if (websiteCount > 0) {
    confirmMessage += `\n\n该分类下有 ${websiteCount} 个网站，删除后这些网站将移到"未分类"。`
  }

  if (confirm(confirmMessage)) {
    try {
      await websiteStore.deleteCategory(category.id)
    } catch (error) {
      console.error('删除分类失败:', error)
    }
  }
}

// 监听添加表单显示，自动聚焦
const focusAddInput = async () => {
  if (showAddForm.value) {
    await nextTick()
    addNameInput.value?.focus()
  }
}

// 监听showAddForm变化
import { watch } from 'vue'
watch(showAddForm, focusAddInput)
</script>

<style scoped>
.category-manager {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manager-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .manager-title {
  color: rgb(243 244 246);
}

.button-icon {
  width: 16px;
  height: 16px;
  margin-right: 0.5rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-item {
  background-color: white;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.2s ease-in-out;
}

.dark .category-item {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
}

.category-item.editing,
.category-item.adding {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.category-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.category-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.category-icon {
  font-size: 1.25rem;
  width: 2rem;
  text-align: center;
}

.category-details {
  flex: 1;
}

.category-name {
  font-weight: 500;
  color: rgb(17 24 39);
  margin-bottom: 0.25rem;
}

.dark .category-name {
  color: rgb(243 244 246);
}

.category-description {
  font-size: 0.875rem;
  color: rgb(107 114 128);
}

.dark .category-description {
  color: rgb(156 163 175);
}

.category-count {
  font-size: 0.75rem;
  color: rgb(107 114 128);
  background-color: rgb(249 250 251);
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  white-space: nowrap;
}

.dark .category-count {
  color: rgb(156 163 175);
  background-color: rgb(55 65 81);
}

.category-color {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

.action-btn.edit {
  background-color: rgb(249 250 251);
  color: rgb(107 114 128);
}

.dark .action-btn.edit {
  background-color: rgb(55 65 81);
  color: rgb(156 163 175);
}

.action-btn.edit:hover {
  background-color: rgb(59 130 246);
  color: white;
}

.action-btn.delete {
  background-color: rgb(254 242 242);
  color: rgb(239 68 68);
}

.dark .action-btn.delete {
  background-color: rgb(69 26 26);
  color: rgb(248 113 113);
}

.action-btn.delete:hover {
  background-color: rgb(239 68 68);
  color: white;
}

.action-btn.save {
  background-color: rgb(34 197 94);
  color: white;
}

.action-btn.save:hover:not(:disabled) {
  background-color: rgb(22 163 74);
}

.action-btn.save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.cancel {
  background-color: rgb(107 114 128);
  color: white;
}

.action-btn.cancel:hover {
  background-color: rgb(75 85 99);
}

/* 编辑表单 */
.category-edit {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.edit-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-row {
  display: flex;
  gap: 0.75rem;
}

.edit-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.375rem;
  background-color: white;
  color: rgb(17 24 39);
  font-size: 0.875rem;
}

.dark .edit-input {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
  color: rgb(243 244 246);
}

.edit-input:focus {
  outline: none;
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.icon-input {
  max-width: 80px;
  text-align: center;
}

.edit-color {
  width: 40px;
  height: 38px;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.375rem;
  cursor: pointer;
}

.dark .edit-color {
  border-color: rgb(75 85 99);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: rgb(156 163 175);
}

.dark .empty-icon {
  color: rgb(107 114 128);
}

.empty-text {
  color: rgb(107 114 128);
  margin-bottom: 1.5rem;
}

.dark .empty-text {
  color: rgb(156 163 175);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .category-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .category-info {
    width: 100%;
  }

  .category-main {
    flex-wrap: wrap;
  }

  .category-edit {
    flex-direction: column;
  }

  .form-row {
    flex-direction: column;
  }

  .icon-input {
    max-width: none;
  }

  .edit-actions {
    align-self: flex-end;
  }
}
</style>
