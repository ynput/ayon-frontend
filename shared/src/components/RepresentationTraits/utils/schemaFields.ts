import type { TraitJsonSchema } from '@shared/api'
import { isPlainObject } from './traitModel'

// format of a value holding traits keyed by their ids (items of the Bundle trait)
export const TRAITS_FORMAT = 'ayon-traits'

// strings longer than this are shortened until expanded
export const LONG_TEXT_LENGTH = 300

export type ValueKind =
  | 'empty'
  | 'boolean'
  | 'number'
  | 'string'
  | 'path'
  | 'regex'
  | 'enum'
  | 'traits'
  | 'object'
  | 'array'
  | 'tuple'

export type SchemaField = {
  key: string
  label: string
  description?: string
  schema: TraitJsonSchema
  value: unknown
  required: boolean
  // false for values stored on the trait but missing in its definition
  inSchema: boolean
  // false when the stored value does not match the definition, e.g. data written by older code
  matches: boolean
}

const DEFS_PREFIX = '#/$defs/'

/** Follows `$ref` to `$defs` of the root schema. Unknown references resolve to an empty schema. */
export const resolveRef = (schema: TraitJsonSchema, root: TraitJsonSchema): TraitJsonSchema => {
  let current = schema
  // guard against reference cycles
  for (let i = 0; i < 10 && current.$ref; i++) {
    const ref = current.$ref
    const target = ref.startsWith(DEFS_PREFIX)
      ? root.$defs?.[ref.slice(DEFS_PREFIX.length)]
      : undefined
    if (!target) return {}
    current = target
  }
  return current
}

const getTypes = (schema: TraitJsonSchema): string[] =>
  schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type]

const valueType = (value: unknown): string => {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/** Shallow check of a value against a schema: its type and enum, not nested values. */
export const matchesSchema = (
  schema: TraitJsonSchema,
  value: unknown,
  root: TraitJsonSchema,
): boolean => {
  const resolved = resolveRef(schema, root)
  if (resolved.anyOf) return resolved.anyOf.some((member) => matchesSchema(member, value, root))
  if (resolved.enum && !resolved.enum.includes(value ?? null)) return false

  const types = getTypes(resolved)
  if (!types.length) return true

  const type = valueType(value)
  if (type === 'number') {
    return types.includes('number') || (types.includes('integer') && Number.isInteger(value))
  }
  return types.includes(type)
}

/** Resolves `$ref` and picks the `anyOf` member (e.g. of an Optional) that matches the value. */
export const pickSchema = (
  schema: TraitJsonSchema,
  value: unknown,
  root: TraitJsonSchema,
): TraitJsonSchema => {
  const resolved = resolveRef(schema, root)
  if (!resolved.anyOf) return resolved

  const member =
    resolved.anyOf.find((item) => matchesSchema(item, value, root)) ||
    resolved.anyOf.find((item) => !getTypes(resolveRef(item, root)).includes('null')) ||
    resolved.anyOf[0]
  return pickSchema(member, value, root)
}

export const getValueKind = (schema: TraitJsonSchema, value: unknown): ValueKind => {
  if (value === null || value === undefined) return 'empty'
  if (schema.format === TRAITS_FORMAT && isPlainObject(value)) return 'traits'
  if (schema.enum) return 'enum'
  if (Array.isArray(value)) return schema.prefixItems ? 'tuple' : 'array'
  if (isPlainObject(value)) return 'object'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (schema.format === 'path') return 'path'
  if (schema.format === 'regex') return 'regex'
  return 'string'
}

/** `frame_start_handle` -> `Frame start handle`, `displayWindow` -> `Display window` */
export const humanizeKey = (key: string): string => {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Fields of an object value in definition order, followed by stored keys the definition does not know. */
export const getSchemaFields = (
  schema: TraitJsonSchema,
  value: Record<string, unknown>,
  root: TraitJsonSchema,
): SchemaField[] => {
  const properties = schema.properties || {}
  const required = schema.required || []
  const fields: SchemaField[] = []

  for (const [key, propertySchema] of Object.entries(properties)) {
    if (!(key in value)) continue
    const resolved = pickSchema(propertySchema, value[key], root)
    fields.push({
      key,
      label: propertySchema.title || resolved.title || humanizeKey(key),
      description: propertySchema.description || resolved.description,
      schema: resolved,
      value: value[key],
      required: required.includes(key),
      inSchema: true,
      matches: matchesSchema(propertySchema, value[key], root),
    })
  }

  for (const [key, fieldValue] of Object.entries(value)) {
    if (key in properties) continue
    fields.push({
      key,
      label: humanizeKey(key),
      schema: {},
      value: fieldValue,
      required: false,
      inSchema: false,
      matches: true,
    })
  }

  return fields
}

/** Schema of array items at `index`, from `prefixItems` (tuples) or `items`. */
export const getItemSchema = (
  schema: TraitJsonSchema,
  index: number,
  value: unknown,
  root: TraitJsonSchema,
): TraitJsonSchema => pickSchema(schema.prefixItems?.[index] || schema.items || {}, value, root)

export const isScalar = (value: unknown): boolean =>
  value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)

export const formatScalar = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
