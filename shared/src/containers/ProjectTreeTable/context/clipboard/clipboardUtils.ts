import { toast } from 'react-toastify'
import { EntitiesMap, FolderNodeMap, TaskNodeMap } from '../../types/table'
import { ParsedClipboardData } from './clipboardTypes'

export const clipboardError = (error: string) => toast.error(error)

// Parse clipboard text into rows and columns
export const parseClipboardText = (clipboardText: string): ParsedClipboardData[] => {
  const rows = clipboardText.trim().split('\n')
  const parsedData: ParsedClipboardData[] = []

  // Store original column order for validation
  const origColumnOrder: string[] = []

  // Parse each row into values
  rows.forEach((row) => {
    const rowValues = row.split('\t')
    parsedData.push({ values: rowValues, colIds: origColumnOrder })
  })

  return parsedData
}

// Get the full path for an entity
export const getEntityPath = (entityId: string, entitiesMap: EntitiesMap): string => {
  const entity = entitiesMap.get(entityId)
  if (!entity) return ''

  const name = entity.name || ''
  // @ts-ignore
  const parentId = entity.folderId || entity.parentId

  // If no parent, return just the name
  if (!parentId) return name

  // If has parent, get parent path (parents are always folders)
  const parentPath = getEntityPath(parentId, entitiesMap)

  // Combine paths with " / " separator
  return parentPath ? `${parentPath} / ${name}` : name
}

// Process a field value based on its type
export const processFieldValue = (
  value: string,
  fieldValueType: 'string' | 'number' | 'boolean' | 'array',
): any => {
  if (fieldValueType === 'array') {
    try {
      // Try to parse as JSON first (for copied arrays)
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        // If not valid JSON, treat as comma-separated values
        return value.includes(',') ? value.split(',').map((v) => v.trim()) : [value]
      }
    } catch {
      // Fallback to single-item array if parsing fails
      return [value]
    }
  } else if (fieldValueType === 'number') {
    return Number(value) || 0
  } else if (fieldValueType === 'boolean') {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes'
  }

  // Default string handling
  return value
}
