<template>
  <form @submit.prevent="handleSubmit" class="website-form">
    <!-- 网站名称 -->
    <div class="form-group">
      <label for="name" class="form-label">
        网站名称 <span class="required">*</span>
      </label>
      <BaseInput id="name" v-model="formData.name" placeholder="请输入网站名称" :error="errors.name" :disabled="isLoading"
        required @blur="validateField('name')" />
    </div>

    <!-- 网站URL -->
    <div class="form-group">
      <label for="url" class="form-label">
        网站URL <span class="required">*</span>
      </label>
      <BaseInput id="url" v-model="formData.url" type="url" placeholder="https://example.com" :error="errors.url"
        :disabled="isLoading" required @blur="validateField('url')" @input="handleUrlInput" />
      <div v-if="isPreviewLoading" class="url-preview loading">
        <div class="preview-spinner"></div>
        <span>正在获取网站信息...</span>
      </div>
      <div v-else-if="urlPreview" class="url-preview">
        <img v-if="urlPreview.icon" :src="urlPreview.icon" alt="网站图标" class="preview-icon" />
        <div class="preview-info">
          <div class="preview-title">{{ urlPreview.title }}</div>
          <div class="preview-url">{{ urlPreview.url }}</div>
        </div>
        <button type="button" class="preview-use" @click="usePreviewData">
          使用此信息
        </button>
      </div>
    </div>

    <!-- 网站描述 -->
    <div class="form-group">
      <label for="description" class="form-label">描述</label>
      <BaseInput id="description" v-model="formData.description" placeholder="网站描述（可选）" :error="errors.description"
        :disabled="isLoading" @blur="validateField('description')" />
    </div>

    <!-- 分类选择 -->
    <div class="form-group">
      <label for="category" class="form-label">分类</label>
      <select id="category" v-model="formData.categoryId" class="form-select" :disabled="isLoading">
        <option value="">选择分类（可选）</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.icon }} {{ category.name }}
        </option>
      </select>
    </div>

    <!-- 标签输入 -->
    <div class="form-group">
      <label for="tags" class="form-label">标签</label>
      <div class="tags-input">
        <div class="tags-list">
          <span v-for="(tag, index) in formData.tags" :key="index" class="tag-item">
            {{ tag }}
            <button type="button" @click="removeTag(index)" class="tag-remove">×</button>
          </span>
        </div>
        <input v-model="newTag" type="text" placeholder="输入标签后按回车" class="tag-input" :disabled="isLoading"
          @keydown.enter.prevent="addTag" @keydown.comma.prevent="addTag" />
      </div>
    </div>

    <!-- 选项 -->
    <div class="form-group">
      <div class="form-options">
        <label class="checkbox-label">
          <input v-model="formData.isFavorite" type="checkbox" class="checkbox" :disabled="isLoading" />
          <span>添加到收藏</span>
        </label>
        <label class="checkbox-label">
          <input v-model="formData.isPrivate" type="checkbox" class="checkbox" :disabled="isLoading" />
          <span>设为私有</span>
        </label>
      </div>
    </div>

    <!-- 表单按钮 -->
    <div class="form-actions">
      <BaseButton type="button" variant="secondary" :disabled="isLoading" @click="$emit('cancel')">
        取消
      </BaseButton>
      <BaseButton type="submit" :disabled="isLoading || !isFormValid" :loading="isLoading">
        {{ submitText }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useWebsiteStore } from '@/stores/websiteStore'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { validateCreateWebsiteInput, validateUpdateWebsiteInput } from '@/utils/dataValidation'
import { getWebsitePreview } from '@/utils/urlUtils'
import type { Website, CreateWebsiteInput, UpdateWebsiteInput } from '@/types/website'

// Props
interface Props {
  website?: Website
  submitText?: string
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitText: '保存',
  isLoading: false,
})

// Emits
const emit = defineEmits<{
  submit: [data: CreateWebsiteInput | UpdateWebsiteInput]
  cancel: []
}>()

// Store
const websiteStore = useWebsiteStore()

// 状态
const formData = ref({
  name: '',
  url: '',
  description: '',
  categoryId: '',
  tags: [] as string[],
  isFavorite: false,
  isPrivate: false,
})

const errors = ref({
  name: '',
  url: '',
  description: '',
})

const newTag = ref('')
const urlPreview = ref<{
  title: string
  url: string
  icon?: string
} | null>(null)
const isPreviewLoading = ref(false)

// 计算属性
const categories = computed(() => websiteStore.categories)

const isFormValid = computed(() => {
  return formData.value.name.trim() &&
    formData.value.url.trim() &&
    !errors.value.name &&
    !errors.value.url &&
    !errors.value.description
})

// 方法
const validateField = (field: keyof typeof errors.value) => {
  const data = props.website ? formData.value : formData.value
  const validation = props.website
    ? validateUpdateWebsiteInput(data)
    : validateCreateWebsiteInput(data as CreateWebsiteInput)

  const fieldError = validation.errors.find(e => e.field === field)
  errors.value[field] = fieldError ? fieldError.message : ''
}

const validateForm = () => {
  validateField('name')
  validateField('url')
  validateField('description')
}

const handleUrlInput = async () => {
  const url = formData.value.url.trim()
  if (!url || !url.startsWith('http')) return

  try {
    isPreviewLoading.value = true
    urlPreview.value = await getWebsitePreview(url)
  } catch (error) {
    console.warn('Failed to get website preview:', error)
    urlPreview.value = null
  } finally {
    isPreviewLoading.value = false
  }
}

const usePreviewData = () => {
  if (urlPreview.value) {
    if (!formData.value.name.trim()) {
      formData.value.name = urlPreview.value.title
    }
  }
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  formData.value.tags.splice(index, 1)
}

const handleSubmit = () => {
  validateForm()
  if (isFormValid.value) {
    const data: any = { ...formData.value }
    if (!data.categoryId) {
      delete data.categoryId
    }
    emit('submit', data)
  }
}

// 初始化表单数据
const initializeForm = () => {
  if (props.website) {
    formData.value = {
      name: props.website.name,
      url: props.website.url,
      description: props.website.description || '',
      categoryId: props.website.categoryId || '',
      tags: [...props.website.tags],
      isFavorite: props.website.isFavorite,
      isPrivate: props.website.isPrivate,
    }
  }
}

// 监听props变化
watch(() => props.website, initializeForm, { immediate: true })

onMounted(() => {
  initializeForm()
})
</script>

<style scoped>
.website-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.required {
  color: rgb(239 68 68);
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

.form-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* URL预览 */
.url-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: rgb(249 250 251);
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

.dark .url-preview {
  background-color: rgb(55 65 81);
  border-color: rgb(75 85 99);
}

.url-preview.loading {
  justify-content: center;
}

.preview-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgb(229 231 235);
  border-top: 2px solid rgb(59 130 246);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.dark .preview-spinner {
  border-color: rgb(75 85 99);
  border-top-color: rgb(59 130 246);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-icon {
  width: 24px;
  height: 24px;
  border-radius: 0.25rem;
  object-fit: cover;
}

.preview-info {
  flex: 1;
}

.preview-title {
  font-weight: 500;
  color: rgb(17 24 39);
  font-size: 0.875rem;
}

.dark .preview-title {
  color: rgb(243 244 246);
}

.preview-url {
  font-size: 0.75rem;
  color: rgb(107 114 128);
}

.dark .preview-url {
  color: rgb(156 163 175);
}

.preview-use {
  padding: 0.375rem 0.75rem;
  background-color: rgb(59 130 246);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.preview-use:hover {
  background-color: rgb(37 99 235);
}

/* 标签输入 */
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid rgb(229 231 235);
  border-radius: 0.5rem;
  background-color: white;
  min-height: 2.75rem;
}

.dark .tags-input {
  background-color: rgb(31 41 55);
  border-color: rgb(75 85 99);
}

.tags-input:focus-within {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background-color: rgb(59 130 246);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.75rem;
}

.tag-remove {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
}

.tag-remove:hover {
  opacity: 0.8;
}

.tag-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: rgb(17 24 39);
  font-size: 0.875rem;
  min-width: 120px;
}

.dark .tag-input {
  color: rgb(243 244 246);
}

.tag-input::placeholder {
  color: rgb(156 163 175);
}

.dark .tag-input::placeholder {
  color: rgb(107 114 128);
}

/* 表单选项 */
.form-options {
  display: flex;
  gap: 1.5rem;
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

/* 表单按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgb(229 231 235);
}

.dark .form-actions {
  border-top-color: rgb(75 85 99);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .form-options {
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .tags-input {
    padding: 0.5rem;
  }
}
</style>
