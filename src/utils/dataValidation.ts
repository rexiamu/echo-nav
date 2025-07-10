import type {
  Website,
  Category,
  Tag,
  CreateWebsiteInput,
  UpdateWebsiteInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  ValidationError,
  AppData,
} from '@/types/website'

// 验证错误代码
export const VALIDATION_CODES = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_URL: 'INVALID_URL',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_LENGTH: 'INVALID_LENGTH',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_VALUE: 'DUPLICATE_VALUE',
  INVALID_REFERENCE: 'INVALID_REFERENCE',
} as const

/**
 * 验证结果类型
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * 创建验证错误
 */
export function createValidationError(
  field: string,
  message: string,
  code: string
): ValidationError {
  return { field, message, code }
}

/**
 * URL验证
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * 验证字符串长度
 */
export function validateLength(
  value: string,
  min: number = 0,
  max: number = Infinity
): boolean {
  return value.length >= min && value.length <= max
}

/**
 * 验证网站名称
 */
export function validateWebsiteName(name: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!name || name.trim().length === 0) {
    errors.push(
      createValidationError('name', '网站名称不能为空', VALIDATION_CODES.REQUIRED_FIELD)
    )
  } else if (!validateLength(name.trim(), 1, 100)) {
    errors.push(
      createValidationError('name', '网站名称长度必须在1-100字符之间', VALIDATION_CODES.INVALID_LENGTH)
    )
  }

  return errors
}

/**
 * 验证网站URL
 */
export function validateWebsiteUrl(url: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!url || url.trim().length === 0) {
    errors.push(
      createValidationError('url', '网站URL不能为空', VALIDATION_CODES.REQUIRED_FIELD)
    )
  } else if (!isValidUrl(url.trim())) {
    errors.push(
      createValidationError('url', '请输入有效的URL地址', VALIDATION_CODES.INVALID_URL)
    )
  }

  return errors
}

/**
 * 验证创建网站输入
 */
export function validateCreateWebsiteInput(input: CreateWebsiteInput): ValidationResult {
  const errors: ValidationError[] = []

  // 验证名称
  errors.push(...validateWebsiteName(input.name))

  // 验证URL
  errors.push(...validateWebsiteUrl(input.url))

  // 验证描述长度
  if (input.description && !validateLength(input.description, 0, 500)) {
    errors.push(
      createValidationError('description', '描述长度不能超过500字符', VALIDATION_CODES.INVALID_LENGTH)
    )
  }

  // 验证标签
  if (input.tags) {
    input.tags.forEach((tag, index) => {
      if (!validateLength(tag.trim(), 1, 50)) {
        errors.push(
          createValidationError(
            `tags[${index}]`,
            '标签长度必须在1-50字符之间',
            VALIDATION_CODES.INVALID_LENGTH
          )
        )
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 验证更新网站输入
 */
export function validateUpdateWebsiteInput(input: UpdateWebsiteInput): ValidationResult {
  const errors: ValidationError[] = []

  // 验证名称（如果提供）
  if (input.name !== undefined) {
    errors.push(...validateWebsiteName(input.name))
  }

  // 验证URL（如果提供）
  if (input.url !== undefined) {
    errors.push(...validateWebsiteUrl(input.url))
  }

  // 验证描述长度（如果提供）
  if (input.description !== undefined && !validateLength(input.description, 0, 500)) {
    errors.push(
      createValidationError('description', '描述长度不能超过500字符', VALIDATION_CODES.INVALID_LENGTH)
    )
  }

  // 验证标签（如果提供）
  if (input.tags) {
    input.tags.forEach((tag, index) => {
      if (!validateLength(tag.trim(), 1, 50)) {
        errors.push(
          createValidationError(
            `tags[${index}]`,
            '标签长度必须在1-50字符之间',
            VALIDATION_CODES.INVALID_LENGTH
          )
        )
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 验证分类名称
 */
export function validateCategoryName(name: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!name || name.trim().length === 0) {
    errors.push(
      createValidationError('name', '分类名称不能为空', VALIDATION_CODES.REQUIRED_FIELD)
    )
  } else if (!validateLength(name.trim(), 1, 50)) {
    errors.push(
      createValidationError('name', '分类名称长度必须在1-50字符之间', VALIDATION_CODES.INVALID_LENGTH)
    )
  }

  return errors
}

/**
 * 验证创建分类输入
 */
export function validateCreateCategoryInput(input: CreateCategoryInput): ValidationResult {
  const errors: ValidationError[] = []

  // 验证名称
  errors.push(...validateCategoryName(input.name))

  // 验证描述长度
  if (input.description && !validateLength(input.description, 0, 200)) {
    errors.push(
      createValidationError('description', '描述长度不能超过200字符', VALIDATION_CODES.INVALID_LENGTH)
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 验证更新分类输入
 */
export function validateUpdateCategoryInput(input: UpdateCategoryInput): ValidationResult {
  const errors: ValidationError[] = []

  // 验证名称（如果提供）
  if (input.name !== undefined) {
    errors.push(...validateCategoryName(input.name))
  }

  // 验证描述长度（如果提供）
  if (input.description !== undefined && !validateLength(input.description, 0, 200)) {
    errors.push(
      createValidationError('description', '描述长度不能超过200字符', VALIDATION_CODES.INVALID_LENGTH)
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 验证完整的网站对象
 */
export function validateWebsite(website: Website): ValidationResult {
  const errors: ValidationError[] = []

  // 验证ID
  if (!website.id || !validateLength(website.id, 1, 100)) {
    errors.push(
      createValidationError('id', '网站ID无效', VALIDATION_CODES.INVALID_FORMAT)
    )
  }

  // 验证基本字段
  errors.push(...validateWebsiteName(website.name))
  errors.push(...validateWebsiteUrl(website.url))

  // 验证日期
  if (!(website.createdAt instanceof Date) || isNaN(website.createdAt.getTime())) {
    errors.push(
      createValidationError('createdAt', '创建时间无效', VALIDATION_CODES.INVALID_FORMAT)
    )
  }

  if (!(website.updatedAt instanceof Date) || isNaN(website.updatedAt.getTime())) {
    errors.push(
      createValidationError('updatedAt', '更新时间无效', VALIDATION_CODES.INVALID_FORMAT)
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 验证应用数据结构
 */
export function validateAppData(data: any): ValidationResult {
  const errors: ValidationError[] = []

  // 验证基本结构
  if (!data || typeof data !== 'object') {
    errors.push(
      createValidationError('data', '数据格式无效', VALIDATION_CODES.INVALID_FORMAT)
    )
    return { isValid: false, errors }
  }

  // 验证版本
  if (!data.version || typeof data.version !== 'string') {
    errors.push(
      createValidationError('version', '版本信息无效', VALIDATION_CODES.INVALID_FORMAT)
    )
  }

  // 验证数组字段
  const arrayFields = ['websites', 'categories', 'tags']
  arrayFields.forEach(field => {
    if (!Array.isArray(data[field])) {
      errors.push(
        createValidationError(field, `${field}必须是数组`, VALIDATION_CODES.INVALID_FORMAT)
      )
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * 清理和标准化网站数据
 */
export function sanitizeWebsiteData(input: CreateWebsiteInput | UpdateWebsiteInput): typeof input {
  const sanitized = { ...input }

  // 清理字符串字段
  if (sanitized.name) {
    sanitized.name = sanitized.name.trim()
  }
  if (sanitized.url) {
    sanitized.url = sanitized.url.trim()
  }
  if (sanitized.description) {
    sanitized.description = sanitized.description.trim()
  }

  // 清理标签
  if (sanitized.tags) {
    sanitized.tags = sanitized.tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // 去重
  }

  return sanitized
}
