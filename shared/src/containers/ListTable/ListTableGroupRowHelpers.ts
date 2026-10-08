import type { ListTableGroupDisplay } from './ListTable.types'

export const INTERNAL_GROUPING_COLUMN_PREFIX = '__group_path__'

export const parseInternalGroupingColumnId = (columnId: string) => {
  if (!columnId.startsWith(INTERNAL_GROUPING_COLUMN_PREFIX)) return null
  const trimmed = columnId.slice(INTERNAL_GROUPING_COLUMN_PREFIX.length)
  const separatorIndex = trimmed.lastIndexOf('__')
  if (separatorIndex === -1) return null
  const baseColumnId = trimmed.slice(0, separatorIndex)
  const level = Number(trimmed.slice(separatorIndex + 2))
  return Number.isNaN(level) ? null : { baseColumnId, level }
}

export const isGroupDisplayValue = (value: unknown): value is ListTableGroupDisplay =>
  !!value &&
  typeof value === 'object' &&
  ('label' in (value as object) || 'value' in (value as object))

export const isCustomGroupRowValue = (
  value: unknown,
): value is {
  __listTableGroup: true
  __groupColumnId: string
  __groupValue: unknown
} => !!value && typeof value === 'object' && '__listTableGroup' in (value as object)

/** Format a raw group column value into a human-readable label. */
export function defaultGroupLabel(columnId: string, value: unknown): string {
  if (value === null || value === undefined) return '(None)'
  if (typeof value === 'boolean') {
    // Common boolean column label mappings
    if (columnId === 'active') return value ? 'Active' : 'Inactive'
    if (columnId === 'library') return value ? 'Library' : 'Standard'
    return value ? 'Yes' : 'No'
  }
  return String(value)
}
