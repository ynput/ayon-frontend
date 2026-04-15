import { QueryFilter, QueryCondition } from '@shared/containers'
import {
  filterDateFunctions,
  DateOptionType,
} from '@shared/components/SearchFilter/filterDates'

const RELATIVE_PREFIX = 'relative:'

/**
 * Checks if a value is a relative date marker (e.g., "relative:today:0")
 */
export const isRelativeDateValue = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith(RELATIVE_PREFIX)

/**
 * Parses a relative date value into its components
 * Format: "relative:<patternId>:<index>"
 * e.g., "relative:today:0" → { patternId: "today", index: 0 }
 */
const parseRelativeValue = (
  value: string,
): { patternId: DateOptionType; index: number } | null => {
  const parts = value.replace(RELATIVE_PREFIX, '').split(':')
  if (parts.length !== 2) return null

  const patternId = parts[0] as DateOptionType
  const index = parseInt(parts[1], 10)

  if (!(patternId in filterDateFunctions) || isNaN(index)) return null

  return { patternId, index }
}

/**
 * Resolves a relative date value to an actual ISO date string
 * e.g., "relative:today:0" → "2026-04-14T00:00:00.000Z" (current today)
 */
export const resolveRelativeValue = (value: string): string => {
  const parsed = parseRelativeValue(value)
  if (!parsed) return value

  const dateValues = filterDateFunctions[parsed.patternId]()
  return dateValues[parsed.index]?.id ?? value
}

/**
 * Creates a relative date value string from a pattern ID and index
 * e.g., ("today", 0) → "relative:today:0"
 */
export const createRelativeValue = (patternId: DateOptionType, index: number): string =>
  `${RELATIVE_PREFIX}${patternId}:${index}`

/**
 * Expands all relative date values in a QueryFilter to actual ISO dates.
 * Used before sending filters to the backend API.
 * Returns a new QueryFilter with expanded values (does not mutate the original).
 */
export const expandRelativeDates = (queryFilter: QueryFilter): QueryFilter => {
  if (!queryFilter.conditions || queryFilter.conditions.length === 0) {
    return queryFilter
  }

  const expandedConditions = queryFilter.conditions.map((condition) => {
    if ('key' in condition) {
      // QueryCondition — expand value if relative
      const qc = condition as QueryCondition
      if (isRelativeDateValue(qc.value)) {
        return { ...qc, value: resolveRelativeValue(qc.value) }
      }
      return qc
    } else {
      // Nested QueryFilter — recurse
      return expandRelativeDates(condition as QueryFilter)
    }
  })

  return { ...queryFilter, conditions: expandedConditions }
}

export default expandRelativeDates
