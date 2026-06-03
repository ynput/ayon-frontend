import { VisibilityState } from '@tanstack/react-table'

// checks column visibility for fields matching a given field name
// Also support partial matching like `name_*` to check all columns starting with `name_`
export const checkColumnVisibility = (columns: VisibilityState, fieldName: string): boolean => {
  // Exact match
  if (columns[fieldName]) {
    return true
  }

  // Partial match (e.g., name_*)
  const partialMatchKey = Object.keys(columns).find(
    (key) => key.startsWith(fieldName.replace('*', '')) && columns[key],
  )

  return !!partialMatchKey
}
