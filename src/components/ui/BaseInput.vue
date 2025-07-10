<template>
  <div class="input-wrapper">
    <!-- 标签 -->
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- 输入框容器 -->
    <div class="input-container" :class="containerClasses">
      <!-- 前置图标 -->
      <span v-if="icon" class="input-icon input-icon-left" v-html="icon" />

      <!-- 输入框 -->
      <input :id="inputId" :type="type" :placeholder="placeholder" :disabled="disabled" :readonly="readonly"
        :value="modelValue" :class="inputClasses" @input="handleInput" @change="handleChange" @focus="handleFocus"
        @blur="handleBlur" />

      <!-- 清除按钮 -->
      <button v-if="clearable && modelValue && !disabled && !readonly" type="button" class="input-clear"
        @click="handleClear">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- 提示信息 -->
    <div v-if="message" class="input-message" :class="messageClasses">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InputProps, InputEmits } from '@/types/ui'

// Props
const props = withDefaults(defineProps<InputProps & {
  modelValue?: string
  label?: string
  required?: boolean
}>(), {
  type: 'text',
  state: 'normal',
  modelValue: '',
  disabled: false,
  readonly: false,
  clearable: false,
  required: false,
})

// Emits
const emit = defineEmits<InputEmits>()

// 生成唯一ID
const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`)

// 计算输入框容器样式类
const containerClasses = computed(() => {
  const classes = []

  if (props.state === 'error') {
    classes.push('input-container-error')
  } else if (props.state === 'success') {
    classes.push('input-container-success')
  } else if (props.state === 'warning') {
    classes.push('input-container-warning')
  }

  if (props.disabled) {
    classes.push('input-container-disabled')
  }

  return classes.join(' ')
})

// 计算输入框样式类
const inputClasses = computed(() => {
  const classes = ['input']

  if (props.icon) {
    classes.push('input-with-icon')
  }

  if (props.clearable && props.modelValue) {
    classes.push('input-with-clear')
  }

  return classes.join(' ')
})

// 计算提示信息样式类
const messageClasses = computed(() => {
  switch (props.state) {
    case 'error':
      return 'input-message-error'
    case 'success':
      return 'input-message-success'
    case 'warning':
      return 'input-message-warning'
    default:
      return 'input-message-normal'
  }
})

// 事件处理
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('change', target.value)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<style scoped>
.input-wrapper {
  width: 100%;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(55 65 81);
  margin-bottom: 0.25rem;
}

.dark .input-label {
  color: rgb(209 213 219);
}

.input-container {
  position: relative;
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgb(209 213 219);
  border-radius: 0.5rem;
  background-color: white;
  color: rgb(17 24 39);
  outline: none;
  transition: colors 200ms;
}

.input::placeholder {
  color: rgb(107 114 128);
}

.input:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  border-color: transparent;
}

.dark .input {
  background-color: rgb(31 41 55);
  color: rgb(243 244 246);
  border-color: rgb(75 85 99);
}

.dark .input::placeholder {
  color: rgb(156 163 175);
}

.input-with-icon {
  padding-left: 2.5rem;
}

.input-with-clear {
  padding-right: 2.5rem;
}

.input:disabled {
  background-color: rgb(243 244 246);
  color: rgb(107 114 128);
  cursor: not-allowed;
}

.dark .input:disabled {
  background-color: rgb(55 65 81);
  color: rgb(156 163 175);
}

.input:read-only {
  background-color: rgb(249 250 251);
  cursor: default;
}

.dark .input:read-only {
  background-color: rgb(55 65 81);
}

/* 图标 */
.input-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: rgb(156 163 175);
  pointer-events: none;
}

.input-icon-left {
  left: 0.75rem;
}

/* 清除按钮 */
.input-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgb(156 163 175);
  outline: none;
  border: none;
  background: none;
  cursor: pointer;
}

.input-clear:hover {
  color: rgb(75 85 99);
}

.dark .input-clear:hover {
  color: rgb(209 213 219);
}

/* 状态样式 */
.input-container-error .input {
  border-color: rgb(239 68 68);
}

.input-container-error .input:focus {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
}

.input-container-success .input {
  border-color: rgb(34 197 94);
}

.input-container-success .input:focus {
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.5);
}

.input-container-warning .input {
  border-color: rgb(234 179 8);
}

.input-container-warning .input:focus {
  box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.5);
}

.input-container-disabled {
  opacity: 0.5;
}

/* 提示信息 */
.input-message {
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.input-message-normal {
  color: rgb(75 85 99);
}

.dark .input-message-normal {
  color: rgb(156 163 175);
}

.input-message-error {
  color: rgb(220 38 38);
}

.dark .input-message-error {
  color: rgb(248 113 113);
}

.input-message-success {
  color: rgb(22 163 74);
}

.dark .input-message-success {
  color: rgb(74 222 128);
}

.input-message-warning {
  color: rgb(202 138 4);
}

.dark .input-message-warning {
  color: rgb(250 204 21);
}
</style>
