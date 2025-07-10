<template>
  <div :class="cardClasses" @click="handleClick">
    <!-- 卡片头部 -->
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>

    <!-- 卡片内容 -->
    <div v-if="$slots.default" class="card-body">
      <slot />
    </div>

    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CardProps } from '@/types/ui'

// Props
const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
  padding: 'md',
  hoverable: false,
  clickable: false,
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 计算卡片样式类
const cardClasses = computed(() => {
  const classes = ['card']

  // 变体
  switch (props.variant) {
    case 'bordered':
      classes.push('card-bordered')
      break
    case 'shadow':
      classes.push('card-shadow')
      break
    case 'elevated':
      classes.push('card-elevated')
      break
    default:
      classes.push('card-default')
  }

  // 内边距
  switch (props.padding) {
    case 'none':
      classes.push('card-padding-none')
      break
    case 'sm':
      classes.push('card-padding-sm')
      break
    case 'lg':
      classes.push('card-padding-lg')
      break
    default:
      classes.push('card-padding-md')
  }

  // 交互状态
  if (props.hoverable) {
    classes.push('card-hoverable')
  }

  if (props.clickable) {
    classes.push('card-clickable')
  }

  return classes.join(' ')
})

// 处理点击事件
const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.card {
  background-color: white;
  border-radius: 0.5rem;
  transition: all 200ms;
}

.dark .card {
  background-color: rgb(31 41 55);
}

/* 变体 */
.card-default {
  border: 1px solid rgb(229 231 235);
}

.dark .card-default {
  border-color: rgb(55 65 81);
}

.card-bordered {
  border: 2px solid rgb(209 213 219);
}

.dark .card-bordered {
  border-color: rgb(75 85 99);
}

.card-shadow {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid rgb(229 231 235);
}

.dark .card-shadow {
  border-color: rgb(55 65 81);
}

.card-elevated {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgb(229 231 235);
}

.dark .card-elevated {
  border-color: rgb(55 65 81);
}

/* 内边距 */
.card-padding-none .card-body {
  padding: 0;
}

.card-padding-sm .card-body {
  padding: 0.75rem;
}

.card-padding-md .card-body {
  padding: 1rem;
}

.card-padding-lg .card-body {
  padding: 1.5rem;
}

/* 头部和底部 */
.card-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgb(229 231 235);
  background-color: rgb(249 250 251);
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.dark .card-header {
  border-color: rgb(55 65 81);
  background-color: rgb(55 65 81);
}

.card-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid rgb(229 231 235);
  background-color: rgb(249 250 251);
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.dark .card-footer {
  border-color: rgb(55 65 81);
  background-color: rgb(55 65 81);
}

.card-body {
  padding: 1rem;
}

/* 交互状态 */
.card-hoverable:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: scale(1.02);
}

.card-clickable {
  cursor: pointer;
}

.card-clickable:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-clickable:active {
  transform: scale(0.98);
}

/* 响应式调整 */
@media (max-width: 640px) {

  .card-padding-md .card-body,
  .card-header,
  .card-footer {
    padding: 0.5rem 0.75rem;
  }

  .card-padding-lg .card-body {
    padding: 1rem;
  }
}
</style>
