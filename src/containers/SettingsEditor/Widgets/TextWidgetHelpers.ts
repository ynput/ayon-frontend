import type { $Any } from '@types'

export type NumberLimits = {
  min?: number
  max?: number
}

// Inclusive limits from a JSON schema (pydantic `ge` / `le`).
// Exclusive limits (`gt` / `lt`) are left to schema validation: there is no
// value right next to an exclusive bound to clamp onto.
// Draft 4 schemas mark `minimum` / `maximum` as exclusive with a boolean flag.
export const getNumberLimits = (schema: $Any): NumberLimits => ({
  min:
    typeof schema?.minimum === 'number' && schema.exclusiveMinimum !== true
      ? schema.minimum
      : undefined,
  max:
    typeof schema?.maximum === 'number' && schema.exclusiveMaximum !== true
      ? schema.maximum
      : undefined,
})

// Spinner step. Once `min` is set the browser checks the step from `min`, and the
// default step of 1 would mark decimal values like 0.5 as :invalid.
export const getNumberStep = (schema: $Any): number | 'any' | undefined => {
  if (typeof schema?.multipleOf === 'number') return schema.multipleOf
  if (schema?.type === 'number') return 'any'
  return undefined
}

// Clamps a value into the limits. Values in range, and values that are not a
// number yet (e.g. '-'), are returned unchanged.
export const clampNumber = (value: $Any, { min, max }: NumberLimits) => {
  const parsed = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(parsed)) return value
  if (min !== undefined && parsed < min) return min
  if (max !== undefined && parsed > max) return max
  return value
}

// Value to commit for an integer or number field.
export const checkNumber = (
  originalValue: $Any,
  value: $Any,
  type: $Any,
  limits: NumberLimits = {},
) => {
  // no value, return original
  if (value === '') return clampNumber(originalValue || 0, limits)
  // type is integer
  if (type === 'integer') {
    const parsed = parseInt(value)
    return clampNumber(isNaN(parsed) ? 0 : parsed, limits)
  }
  return clampNumber(value, limits)
}
