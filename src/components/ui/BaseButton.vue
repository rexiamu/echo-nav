<template>
  <button :class="buttonClasses" :disabled="disabled || loading" @click="handleClick">
    <!-- 加载图标 -->
    <span v-if="loading" class="loading-icon">
      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </span>

    <!-- 图标 -->
    <span v-else-if="icon" class="icon" v-html="icon" />

    <!-- 按钮内容 -->
    <span v-if="$slots.default" :class="{ 'ml-2': loading || icon }">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps, ButtonEmits } from '@/types/ui'

// Props
const props = withDefaults(defineProps<ButtonProps>(), {
  size: 'md',
  variant: 'primary',
  loading: false,
  disabled: false,
  block: false,
})

// Emits
const emit = defineEmits<ButtonEmits>()

// 计算按钮样式类
const buttonClasses = computed(() => {
  const classes = ['btn']

  // 尺寸
  switch (props.size) {
    case 'sm':
      classes.push('btn-sm')
      break
    case 'lg':
      classes.push('btn-lg')
      break
    default:
      classes.push('btn-md')
  }

  // 变体
  switch (props.variant) {
    case 'secondary':
      classes.push('btn-secondary')
      break
    case 'outline':
      classes.push('btn-outline')
      break
    case 'ghost':
      classes.push('btn-ghost')
      break
    default:
      classes.push('btn-primary')
  }

  // 状态
  if (props.loading) {
    classes.push('btn-loading')
  }

  if (props.disabled) {
    classes.push('btn-disabled')
  }

  if (props.block) {
    classes.push('btn-block')
  }

  return classes.join(' ')
})

// 处理点击事件
const handleClick = (event: MouseEvent) => {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 200ms;
  outline: none;
  border: none;
}

.btn:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 尺寸 */
.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

/* 变体 */
.btn-primary {
  background-color: rgb(37 99 235);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: rgb(29 78 216);
}

.btn-secondary {
  background-color: rgb(229 231 235);
  color: rgb(17 24 39);
}

.btn-secondary:hover:not(:disabled) {
  background-color: rgb(209 213 219);
}

.dark .btn-secondary {
  background-color: rgb(55 65 81);
  color: rgb(243 244 246);
}

.dark .btn-secondary:hover:not(:disabled) {
  background-color: rgb(75 85 99);
}

.btn-outline {
  border: 2px solid rgb(37 99 235);
  color: rgb(37 99 235);
  background-color: transparent;
}

.btn-outline:hover:not(:disabled) {
  background-color: rgb(37 99 235);
  color: white;
}

.btn-ghost {
  background-color: transparent;
  color: rgb(55 65 81);
}

.btn-ghost:hover:not(:disabled) {
  background-color: rgb(243 244 246);
}

.dark .btn-ghost {
  color: rgb(209 213 219);
}

.dark .btn-ghost:hover:not(:disabled) {
  background-color: rgb(31 41 55);
}

/* 状态 */
.btn-loading {
  cursor: wait;
}

.btn-disabled {
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

/* 图标和加载动画 */
.loading-icon,
.icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-icon svg,
.icon svg {
  width: 1rem;
  height: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
