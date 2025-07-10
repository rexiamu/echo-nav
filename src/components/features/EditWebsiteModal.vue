<template>
  <BaseModal
    v-model="isVisible"
    title="编辑网站"
    size="lg"
    :closable="!isLoading"
  >
    <WebsiteForm
      :website="website"
      :is-loading="isLoading"
      submit-text="保存更改"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
    
    <!-- 删除按钮 -->
    <template #footer>
      <div class="modal-footer-actions">
        <div class="footer-left">
          <BaseButton
            variant="danger"
            size="sm"
            :disabled="isLoading"
            @click="showDeleteConfirm = true"
          >
            删除网站
          </BaseButton>
        </div>
        <div class="footer-right">
          <!-- WebsiteForm的按钮会显示在这里 -->
        </div>
      </div>
    </template>
  </BaseModal>

  <!-- 删除确认对话框 -->
  <BaseModal
    v-model="showDeleteConfirm"
    title="确认删除"
    size="sm"
  >
    <div class="delete-confirm">
      <div class="delete-icon">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
      </div>
      <h3 class="delete-title">删除网站</h3>
      <p class="delete-message">
        确定要删除网站 <strong>{{ website?.name }}</strong> 吗？此操作无法撤销。
      </p>
    </div>

    <template #footer>
      <div class="delete-actions">
        <BaseButton
          variant="secondary"
          :disabled="isDeleting"
          @click="showDeleteConfirm = false"
        >
          取消
        </BaseButton>
        <BaseButton
          variant="danger"
          :loading="isDeleting"
          @click="handleDelete"
        >
          确认删除
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWebsiteStore } from '@/stores/websiteStore'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import WebsiteForm from './WebsiteForm.vue'
import type { Website, UpdateWebsiteInput } from '@/types/website'

// Props
interface Props {
  modelValue: boolean
  website?: Website
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [website: Website]
  'deleted': [websiteId: string]
  'error': [error: string]
}>()

// Store
const websiteStore = useWebsiteStore()

// 状态
const isLoading = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

// 计算属性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const handleSubmit = async (data: UpdateWebsiteInput) => {
  if (!props.website) return

  try {
    isLoading.value = true
    
    const updatedWebsite = await websiteStore.updateWebsite(props.website.id, data)
    
    emit('success', updatedWebsite)
    emit('update:modelValue', false)
    
    // 显示成功消息
    console.log('网站更新成功:', updatedWebsite.name)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '更新网站失败'
    emit('error', errorMessage)
    console.error('更新网站失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (!isLoading.value) {
    emit('update:modelValue', false)
  }
}

const handleDelete = async () => {
  if (!props.website) return

  try {
    isDeleting.value = true
    
    await websiteStore.deleteWebsite(props.website.id)
    
    emit('deleted', props.website.id)
    emit('update:modelValue', false)
    showDeleteConfirm.value = false
    
    // 显示成功消息
    console.log('网站删除成功:', props.website.name)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '删除网站失败'
    emit('error', errorMessage)
    console.error('删除网站失败:', error)
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.modal-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-left {
  flex: 1;
}

.footer-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

/* 删除确认对话框 */
.delete-confirm {
  text-align: center;
  padding: 1rem 0;
}

.delete-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  color: rgb(239 68 68);
}

.delete-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin-bottom: 0.5rem;
}

.dark .delete-title {
  color: rgb(243 244 246);
}

.delete-message {
  color: rgb(107 114 128);
  line-height: 1.5;
  margin-bottom: 0;
}

.dark .delete-message {
  color: rgb(156 163 175);
}

.delete-message strong {
  color: rgb(17 24 39);
  font-weight: 600;
}

.dark .delete-message strong {
  color: rgb(243 244 246);
}

.delete-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .modal-footer-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .footer-left,
  .footer-right {
    width: 100%;
    justify-content: center;
  }
  
  .delete-actions {
    flex-direction: column-reverse;
  }
}
</style>
