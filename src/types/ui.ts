// UI组件相关的类型定义

export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonState = 'normal' | 'loading' | 'disabled'

export interface ButtonProps {
  size?: ButtonSize
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  block?: boolean
  icon?: string
}

export type CardVariant = 'default' | 'bordered' | 'shadow' | 'elevated'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps {
  variant?: CardVariant
  padding?: CardPadding
  hoverable?: boolean
  clickable?: boolean
}

export type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'url'
export type InputState = 'normal' | 'error' | 'success' | 'warning'

export interface InputProps {
  type?: InputType
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  state?: InputState
  message?: string
  icon?: string
  clearable?: boolean
}

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  modelValue: boolean
  title?: string
  size?: ModalSize
  closable?: boolean
  maskClosable?: boolean
  persistent?: boolean
}

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  theme: Theme
  systemTheme: 'light' | 'dark'
  isDark: boolean
}

// 事件类型
export interface ButtonEmits {
  click: [event: MouseEvent]
}

export interface InputEmits {
  'update:modelValue': [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
}

export interface ModalEmits {
  'update:modelValue': [value: boolean]
  close: []
  confirm: []
  cancel: []
}
