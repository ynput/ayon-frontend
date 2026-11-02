// Fragments of the ValueError messages the backend's build_filter raises
// (ayon_server/sqlfilter.py) when a QueryFilter is malformed or points at an
// unknown key. Matching these tells a corrupt-filter failure apart from an
// unrelated server error.
const FILTER_ERROR_SIGNATURES = [
  'invalid path',
  'invalid key',
  'invalid value',
  'invalid condition',
  'invalid list operator',
  'value cannot be null',
  'value must be',
  'value type in list',
  'empty path',
  'json filter error',
]

// Minimal structural shape so any QueryFilter variant (the table's folders type
// or the wider @shared/api one) can be passed without a cast.
import { getRequestErrorString } from '@shared/util'

export type ActiveFilters = {
  filter?: { conditions?: unknown[] } | null
  search?: string | null
}

export const hasActiveFilters = (filters?: ActiveFilters): boolean => {
  const conditions = filters?.filter?.conditions ?? []
  return conditions.length > 0 || !!filters?.search
}

// A load failure counts as filter-related when the backend reports a malformed
// filter, or (fallback) when any filter is applied — the usual cause of an
// otherwise-unexplained load failure.
export const isFilterError = (error: unknown, filters?: ActiveFilters): boolean => {
  if (!error) return false
  const message = getRequestErrorString(error).toLowerCase()
  if (FILTER_ERROR_SIGNATURES.some((signature) => message.includes(signature))) return true
  return hasActiveFilters(filters)
}

export const getFilterErrorMessage = (entities = 'Items'): string =>
  `${entities} were unable to load due to a corrupt filter.`

export const getEntitiesLabelFromScopes = (scopes: string[] = []): string => {
  if (scopes.includes('product')) return 'Products'
  if (scopes.includes('version')) return 'Versions'
  if (scopes.includes('task')) return 'Tasks'
  if (scopes.includes('folder')) return 'Folders'
  return 'Items'
}
