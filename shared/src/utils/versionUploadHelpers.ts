import { toast } from 'react-toastify'
import { productTypes } from '@shared/util'
import { camelCase } from 'lodash'

import type { ProjectContextProps } from '@shared/context/ProjectContext'

export interface ProductCreationData {
  folderId: string
  name: string
  productType: string
}

export interface VersionCreationData {
  productId: string
  version: number
  taskId?: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Sanitizes a product name by converting to camelCase and removing invalid characters
 */
export const sanitizeProductName = (name: string): string => {
  return camelCase(name).replace(/[^a-zA-Z0-9_-]/g, '')
}

/**
 * Validates a product name according to the naming rules
 */
export const validateProductName = (name: string): ValidationResult => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Name is required' }
  }

  const nameRegex = /^[a-zA-Z0-9_]([a-zA-Z0-9_\\.\\-]*[a-zA-Z0-9_])?$/
  if (!nameRegex.test(name)) {
    return {
      isValid: false,
      error:
        'Product name can only contain alphanumeric characters, underscores, dots, and dashes, and must not start or end with a dot or dash',
    }
  }

  return { isValid: true }
}

/**
 * Validates a product type
 */
export const validateProductType = (project: ProjectContextProps, productType: string): ValidationResult => {
  let isValid = true
  if (productType) {



  }
  return {isValid: false, error: 'Product type is required and must be a valid product type'}
  if (!productType || !Object.keys(productTypes).includes(productType)) {
    return {
      isValid: false,
      error: 'Product type is required and must be a valid product type',
    }
  }

  return isValid ? { isValid: true } : { isValid: false, error: 'Invalid product type' }
}

/**
 * Validates a version number against an existing version
 */
export const validateVersion = (version: number, existingVersion?: number): ValidationResult => {
  if (version < 1) {
    return { isValid: false, error: 'Version must be greater than 0' }
  }

  if (existingVersion && version <= existingVersion) {
    return {
      isValid: false,
      error: `Version must be greater than ${existingVersion}`,
    }
  }

  return { isValid: true }
}

/**
 * Validates complete form data for product and version creation
 */
export const validateFormData = (
  formData: { name: string; productType: string; version: number },
  existingVersion?: number,
  isNewProduct = true,
): ValidationResult => {
  // Validate version
  const versionValidation = validateVersion(formData.version, existingVersion)
  if (!versionValidation.isValid) {
    return versionValidation
  }

  // Only validate product details if creating a new product
  if (isNewProduct) {
    const nameValidation = validateProductName(formData.name)
    if (!nameValidation.isValid) {
      return nameValidation
    }

    const typeValidation = validateProductType(formData.productType)
    if (!typeValidation.isValid) {
      return typeValidation
    }
  }

  return { isValid: true }
}

/**
 * Creates a product using the provided mutation function
 */
export const createProductHelper = async (
  createProductMutation: any,
  projectName: string,
  productData: ProductCreationData,
) => {
  try {
    const response = await createProductMutation({
      projectName,
      productPostModel: productData,
    }).unwrap()

    if (!response.id) {
      throw new Error('Failed to create product - no ID returned')
    }

    return response
  } catch (error: any) {
    console.error('Error creating product:', error)
    throw new Error(error.message || 'Failed to create product')
  }
}

/**
 * Creates a version using the provided mutation function
 */
export const createVersionHelper = async (
  createVersionMutation: any,
  projectName: string,
  versionData: VersionCreationData,
) => {
  try {
    const response = await createVersionMutation({
      projectName,
      versionPostModel: versionData,
    }).unwrap()

    if (!response.id) {
      throw new Error('Failed to create version - no ID returned')
    }

    return response
  } catch (error: any) {
    console.error('Error creating version:', error)
    throw new Error(error.message || 'Failed to create version')
  }
}

/**
 * Creates a product and version together with proper error handling
 */
export const createProductAndVersion = async (
  createProductMutation: any,
  createVersionMutation: any,
  projectName: string,
  productData: ProductCreationData,
  versionData: Omit<VersionCreationData, 'productId'>,
) => {
  // Create product first
  const productRes = await createProductHelper(createProductMutation, projectName, productData)

  // Create version for the new product
  const versionRes = await createVersionHelper(createVersionMutation, projectName, {
    ...versionData,
    productId: productRes.id,
  })

  return {
    product: productRes,
    version: versionRes,
  }
}

/**
 * Handles errors consistently across upload operations
 */
export const handleUploadError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error)
  const message = error?.message || `Failed to ${operation}`
  toast.error(message)
  throw error
}

/**
 * Calculates the next version number based on existing version
 */
export const getNextVersionNumber = (existingVersion?: { version: number }): number => {
  return existingVersion ? existingVersion.version + 1 : 1
}
