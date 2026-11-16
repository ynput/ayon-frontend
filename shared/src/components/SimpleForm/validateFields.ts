import type { SimpleFormField } from '@shared/api'
import type { FieldPatchMap } from './ruleEngine'
import type { SimpleFormValue, SimpleFormValueDict } from './types'

/** fieldName -> the message to show under that field */
export type SimpleFormErrors = Record<string, string>

// a pattern a JS RegExp can't compile (Python-only syntax) is skipped, not reported to the user
const matchesPattern = (pattern: string, value: string) => {
  try {
    return new RegExp(pattern).test(value)
  } catch {
    console.warn(`SimpleForm: invalid regex ${pattern}`)
    return true
  }
}

/**
 * The constraint a field states on its value: `regex` for text, `min`/`max` for integer and float
 * (the server form builder offers no others). An empty value is not checked, as in an HTML form:
 * the schema has no required rule. Same checks and messages as validateUpdateEntities.
 */
export const getFieldError = (
  field: SimpleFormField,
  value: SimpleFormValue,
): string | undefined => {
  if (field.type === 'text') {
    if (typeof value !== 'string' || value === '') return
    if (field.regex && !matchesPattern(field.regex, value)) {
      return `Must match pattern ${field.regex}`
    }
  }
  if (field.type === 'integer' || field.type === 'float') {
    // a cleared number input gives NaN (parseInt/parseFloat of ''), that is an empty value
    if (typeof value !== 'number' || Number.isNaN(value)) return
    if (field.min != null && value < field.min) return `Must be ≥ ${field.min}`
    if (field.max != null && value > field.max) return `Must be ≤ ${field.max}`
  }
}

/**
 * Errors of the fields as the user sees them now, rule patches applied. A field the user can't
 * edit (hidden or disabled, statically or by a rule, the same test as FormField) is not checked:
 * its value comes from the form or a rule, and an error there could never be fixed.
 */
export const getFieldErrors = (
  fields: SimpleFormField[],
  patches: FieldPatchMap,
  values: SimpleFormValueDict,
): SimpleFormErrors => {
  const errors: SimpleFormErrors = {}
  for (const field of fields) {
    const effective = { ...field, ...patches[field.name] } as SimpleFormField
    if (effective.type === 'hidden' || effective.hidden) continue
    if (effective.disabled) continue
    const error = getFieldError(effective, values[field.name])
    if (error) errors[field.name] = error
  }
  return errors
}
