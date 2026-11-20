import { Registry } from '@rjsf/utils'
import { $Any } from '@types'
import { resolveSchema } from './schemaCache'

// Why a group's or field's value can't be changed from its right-click menu (Paste, Edit raw
// settings...), shown on the raw settings dialog's greyed out Confirm button
export const NO_EDIT_PERMISSION = "You don't have edit permissions"
export const HAS_READ_ONLY_SETTINGS = 'Contains read-only settings'

/** A field the form shows but doesn't let change: as TextWidget and SelectWidget disable it */
export const isReadOnlyField = (schema: $Any, value: unknown): boolean =>
  !!(
    schema?.readonly ||
    schema?.readOnly ||
    schema?.disabled ||
    (schema?.fixedValue && schema.fixedValue === value)
  )

// per raw (unresolved) schema and value: an edit only changes the values on its path, so a
// right-click after it walks those again, not the whole addon
const cache = new WeakMap<object, WeakMap<object, boolean>>()

/** Whether a field, or anything inside a group or list, is read-only */
export const hasReadOnlySetting = (rawSchema: $Any, value: $Any, registry: Registry): boolean => {
  if (!rawSchema || typeof rawSchema !== 'object') return false
  const valueKey = value && typeof value === 'object' ? (value as object) : null
  if (valueKey) {
    const cached = cache.get(rawSchema)?.get(valueKey)
    if (cached !== undefined) return cached
  }

  const schema: $Any = resolveSchema(registry.schemaUtils, rawSchema, value)
  let result = isReadOnlyField(schema, value)

  if (!result && schema?.type === 'object' && schema.properties) {
    for (const name in schema.properties) {
      if (hasReadOnlySetting(schema.properties[name], value?.[name], registry)) {
        result = true
        break
      }
    }
  }

  const items = schema?.items
  if (
    !result &&
    schema?.type === 'array' &&
    items &&
    !Array.isArray(items) &&
    Array.isArray(value)
  ) {
    result = value.some((item) => hasReadOnlySetting(items, item, registry))
  }

  if (valueKey) {
    if (!cache.has(rawSchema)) cache.set(rawSchema, new WeakMap())
    cache.get(rawSchema)!.set(valueKey, result)
  }
  return result
}

/**
 * Why the value at a menu can't be changed, or undefined when it can: the page is read-only for
 * this user (formContext.readOnly), or the field or group holds a read-only field
 */
export const getReadOnlyReason = (
  formContext: $Any,
  schema: $Any,
  value: $Any,
  registry: Registry,
): string | undefined => {
  if (formContext?.readOnly) return NO_EDIT_PERMISSION
  if (hasReadOnlySetting(schema, value, registry)) return HAS_READ_ONLY_SETTINGS
  return undefined
}
