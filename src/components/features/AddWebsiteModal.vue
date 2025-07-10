<template>
  <BaseModal v-model="isVisible" title="添加新网站" size="lg" :closable="!isLoading">
    <WebsiteForm :is-loading="isLoading" submit-text="添加网站" @submit="handleSubmit" @cancel="handleCancel" />
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWebsiteStore } from '@/stores/websiteStore'
import BaseModal from '@/components/ui/BaseModal.vue'
import WebsiteForm from './WebsiteForm.vue'
import type { CreateWebsiteInput, UpdateWebsiteInput } from '@/types/website'

// Props
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [website: any]
  'error': [error: string]
}>()

// Store
const websiteStore = useWebsiteStore()

// 状态
const isLoading = ref(false)

// 计算属性
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 方法
const handleSubmit = async (data: CreateWebsiteInput | UpdateWebsiteInput) => {
  try {
    isLoading.value = true

    const website = await websiteStore.createWebsite(data as CreateWebsiteInput)

    emit('success', website)
    emit('update:modelValue', false)

    // 显示成功消息
    console.log('网站添加成功:', website.name)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '添加网站失败'
    emit('error', errorMessage)
    console.error('添加网站失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  if (!isLoading.value) {
    emit('update:modelValue', false)
  }
}
</script>
