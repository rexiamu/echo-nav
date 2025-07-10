<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick" @keydown.esc="handleEscape">
        <div :class="modalClasses" @click.stop>
          <!-- 模态框头部 -->
          <div v-if="title || closable || $slots.header" class="modal-header">
            <div class="modal-title">
              <slot name="header">
                <h3 v-if="title" class="modal-title-text">
                  {{ title }}
                </h3>
              </slot>
            </div>

            <!-- 关闭按钮 -->
            <button v-if="closable" type="button" class="modal-close" @click="handleClose">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 模态框内容 -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- 模态框底部 -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue'
import type { ModalProps, ModalEmits } from '@/types/ui'

// Props
const props = withDefaults(defineProps<ModalProps>(), {
  size: 'md',
  closable: true,
  maskClosable: true,
  persistent: false,
})

// Emits
const emit = defineEmits<ModalEmits>()

// 计算模态框样式类
const modalClasses = computed(() => {
  const classes = ['modal']

  // 尺寸
  switch (props.size) {
    case 'sm':
      classes.push('modal-sm')
      break
    case 'lg':
      classes.push('modal-lg')
      break
    case 'xl':
      classes.push('modal-xl')
      break
    case 'full':
      classes.push('modal-full')
      break
    default:
      classes.push('modal-md')
  }

  return classes.join(' ')
})

// 处理遮罩点击
const handleOverlayClick = () => {
  if (props.maskClosable && !props.persistent) {
    handleClose()
  }
}

// 处理ESC键
const handleEscape = () => {
  if (props.closable && !props.persistent) {
    handleClose()
  }
}

// 处理关闭
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

// 监听模态框显示状态，管理body滚动
watch(() => props.modelValue, (visible) => {
  nextTick(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  })
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.modal {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dark .modal {
  background-color: rgb(31 41 55);
}

/* 尺寸 */
.modal-sm {
  width: 100%;
  max-width: 24rem;
}

.modal-md {
  width: 100%;
  max-width: 28rem;
}

.modal-lg {
  width: 100%;
  max-width: 32rem;
}

.modal-xl {
  width: 100%;
  max-width: 42rem;
}

.modal-full {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border-radius: 0;
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgb(229 231 235);
  flex-shrink: 0;
}

.dark .modal-header {
  border-color: rgb(55 65 81);
}

.modal-title {
  flex: 1;
}

.modal-title-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(17 24 39);
  margin: 0;
}

.dark .modal-title-text {
  color: rgb(243 244 246);
}

.modal-close {
  color: rgb(156 163 175);
  outline: none;
  border: none;
  background: none;
  cursor: pointer;
  margin-left: 1rem;
}

.modal-close:hover,
.modal-close:focus {
  color: rgb(75 85 99);
}

.dark .modal-close:hover,
.dark .modal-close:focus {
  color: rgb(209 213 219);
}

/* 内容 */
.modal-body {
  padding: 1rem 1.5rem;
  flex: 1;
  overflow-y: auto;
}

/* 底部 */
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgb(229 231 235);
  flex-shrink: 0;
}

.dark .modal-footer {
  border-color: rgb(55 65 81);
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.9) translateY(-20px);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 0.75rem 1rem;
  }

  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    width: 100%;
    max-width: none;
  }
}
</style>
