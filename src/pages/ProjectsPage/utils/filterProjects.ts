import { ProjectTableRow } from '../hooks/useProjectTableRows'
import type {
  QueryFilter,
  QueryCondition,
} from '@shared/containers/ProjectTreeTable/types/operations'
import { SEARCH_FILTER_ID } from '@ynput/ayon-react-components'
import {
  isRelativeDateValue,
  resolveRelativeValue,
} from '@shared/containers/ProjectTreeTable/utils/expandRelativeDates'

/**
 * Applies a QueryFilter to a list of project rows, returning only matching rows.
 * All filtering is performed client-side.
 */
export const applyProjectFilters = (
  rows: ProjectTableRow[],
  queryFilter: QueryFilter,
): ProjectTableRow[] => {
  if (!queryFilter?.conditions?.length) return rows
  return rows.filter((row) => evaluateQueryFilter(row, queryFilter))
}

const evaluateQueryFilter = (row: ProjectTableRow, filter: QueryFilter): boolean => {
  const { conditions = [], operator = 'and' } = filter
  const results = conditions.map((condition) =>
    'key' in condition
      ? evaluateCondition(row, condition as QueryCondition)
      : evaluateQueryFilter(row, condition as QueryFilter),
  )
  return operator === 'and' ? results.every(Boolean) : results.some(Boolean)
}

const getRowValue = (row: ProjectTableRow, key: string): unknown => {
  if (key.startsWith('attrib_')) return row.attrib[key.slice(7)]
  switch (key) {
    case 'active':
      return row.active
    case 'library':
      return row.library
    case 'pipeline':
      return row.pipeline
    case 'name':
      return row.name
    case 'label':
      return row.label
    case 'code':
      return row.code
    default:
      return (row as Record<string, unknown>)[key]
  }
}

const stripLikeWildcards = (pattern: string): string => pattern.replace(/%/g, '')

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// An ILIKE pattern as a regex: % is any text, _ one character, a backslash makes the next
// character literal
const likeToRegExp = (pattern: string): RegExp => {
  let source = ''
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]
    if (char === '\\' && i + 1 < pattern.length) source += escapeRegExp(pattern[++i])
    else if (char === '%') source += '[\\s\\S]*'
    else if (char === '_') source += '[\\s\\S]'
    else source += escapeRegExp(char)
  }
  return new RegExp(`^${source}$`, 'i')
}
const likeMatches = (rowValue: unknown, pattern: unknown) =>
  likeToRegExp(String(pattern ?? '')).test(String(rowValue ?? ''))

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value === null || value === undefined ? [] : [value]
const includesValue = (list: unknown[], value: unknown) =>
  list.some((item) => String(item) === String(value))

const evaluateCondition = (row: ProjectTableRow, condition: QueryCondition): boolean => {
  const { key, operator = 'eq', value } = condition

  // Multi-field text search across name, label, code, and description
  if (key === SEARCH_FILTER_ID) {
    const term = (
      typeof value === 'string' ? stripLikeWildcards(value) : String(value ?? '')
    ).toLowerCase()
    if (!term) return true
    const description = row.attrib?.description as string | undefined
    return [row.name, row.label, row.code, description].some((f) => f?.toLowerCase().includes(term))
  }

  const rowValue = getRowValue(row, key)

  // Resolve relative date values (e.g. "relative:this-month:0") to actual ISO strings
  const resolvedValue =
    typeof value === 'string' && isRelativeDateValue(value) ? resolveRelativeValue(value) : value

  // `startswith` and `endswith` are not in the generated operator type yet
  switch (operator as string) {
    case 'eq':
      return rowValue === resolvedValue || String(rowValue) === String(resolvedValue)
    case 'ne':
      return rowValue !== resolvedValue && String(rowValue) !== String(resolvedValue)
    case 'like':
      return likeMatches(rowValue, resolvedValue)
    case 'notlike':
      return !likeMatches(rowValue, resolvedValue)
    case 'startswith':
      return String(rowValue ?? '')
        .toLowerCase()
        .startsWith(String(resolvedValue ?? '').toLowerCase())
    case 'endswith':
      return String(rowValue ?? '')
        .toLowerCase()
        .endsWith(String(resolvedValue ?? '').toLowerCase())
    case 'includesany':
      return asArray(resolvedValue).some((v) => includesValue(asArray(rowValue), v))
    case 'includesall':
      return asArray(resolvedValue).every((v) => includesValue(asArray(rowValue), v))
    case 'excludesany':
      return !asArray(resolvedValue).some((v) => includesValue(asArray(rowValue), v))
    case 'excludesall':
      return !asArray(resolvedValue).every((v) => includesValue(asArray(rowValue), v))
    case 'in': {
      const haystack = Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue]
      return haystack.some((v) => String(rowValue) === String(v))
    }
    case 'notin': {
      const haystack = Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue]
      return !haystack.some((v) => String(rowValue) === String(v))
    }
    case 'isnull':
      return rowValue === null || rowValue === undefined
    case 'notnull':
      return rowValue !== null && rowValue !== undefined
    case 'gt':
      return compareValues(rowValue, resolvedValue) > 0
    case 'gte':
      return compareValues(rowValue, resolvedValue) >= 0
    case 'lt':
      return compareValues(rowValue, resolvedValue) < 0
    case 'lte':
      return compareValues(rowValue, resolvedValue) <= 0
    default:
      return true
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/

/** Numeric comparison, then dates (ISO strings with any offset), then text. */
const compareValues = (a: unknown, b: unknown): number => {
  const numA = Number(a)
  const numB = Number(b)
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB
  if (typeof a === 'string' && typeof b === 'string' && ISO_DATE.test(a) && ISO_DATE.test(b)) {
    const dateA = Date.parse(a)
    const dateB = Date.parse(b)
    if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB
  }
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0
}
