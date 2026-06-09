import { VisibilityState } from '@tanstack/react-table'
import { ROW_SELECTION_COLUMN_ID, DRAG_HANDLE_COLUMN_ID } from '../constants'

export const ALWAYS_VISIBLE_COLUMNS = [ROW_SELECTION_COLUMN_ID, DRAG_HANDLE_COLUMN_ID]

// checks column visibility for fields matching a given field name
// Also support partial matching like `name_*` to check all columns starting with `name_`
// note: if visibility is undefined or null it will be treated as hidden (false) unless in core defaults
export const checkColumnVisibility = (
  columns: VisibilityState,
  fieldName: string,
  defaultVisibility?: VisibilityState,
): boolean => {
  // 0. Always-visible columns (e.g. row-selection, drag-handle) are unconditionally visible.
  //    They can only be removed from the table via the `excludedColumns` prop on ProjectTreeTable,
  //    never by setting visibility to false in saved settings.
  if (ALWAYS_VISIBLE_COLUMNS.includes(fieldName)) {
    return true
  }

  // 1. Check exact match in columns
  if (columns[fieldName] !== undefined && columns[fieldName] !== null) {
    return columns[fieldName]
  }

  // 2. Check exact match in defaults
  if (defaultVisibility && defaultVisibility[fieldName] !== undefined) {
    return defaultVisibility[fieldName]
  }

  // 3. Partial match (e.g., name_*) in columns
  const baseName = fieldName.replace(/\*/g, '')
  const partialMatchKey = Object.keys(columns).find(
    (key) => key.startsWith(baseName) && columns[key] !== undefined,
  )

  if (partialMatchKey !== undefined) {
    // If we have explicit keys that match the prefix, see if any are visible
    return Object.keys(columns).some((key) => key.startsWith(baseName) && columns[key] === true)
  }

  // 4. Partial match in defaults (e.g., if defaultVisibility has 'link_*')
  if (defaultVisibility) {
    const matchingDefaultKey = Object.keys(defaultVisibility).find((key) => {
      if (key.endsWith('*')) {
        const defaultBase = key.slice(0, -1)
        return fieldName.startsWith(defaultBase)
      }
      return false
    })

    if (matchingDefaultKey !== undefined) {
      return defaultVisibility[matchingDefaultKey]
    }
  }

  // 5. Fallback to false (new behavior: opt-in)
  return false
}

// ensures that at least one column is visible
// if none are visible, it will fallback to showing the `name` column
export const ensureAtLeastOneVisibleColumn = (
  resolvedVisibility: VisibilityState,
  columnIds: string[],
): VisibilityState => {
  const visibleCount = columnIds.filter(
    (id) => !ALWAYS_VISIBLE_COLUMNS.includes(id) && resolvedVisibility[id],
  ).length

  if (visibleCount === 0 && columnIds.includes('name')) {
    return {
      ...resolvedVisibility,
      name: true,
    }
  }

  return resolvedVisibility
}
