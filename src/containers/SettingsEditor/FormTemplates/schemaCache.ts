import { $Any } from '@types'

// RJSF's retrieveSchema deep clones on every call, and the flat layout asks it about every
// setting on every change. A schema's resolution only depends on its value through these
// keys, so any other schema is resolved once
const VALUE_DEPENDENT_KEYS = ['if', 'then', 'else', 'dependencies', 'oneOf', 'anyOf']

const isValueDependent = (schema: $Any) =>
  !!schema &&
  typeof schema === 'object' &&
  (VALUE_DEPENDENT_KEYS.some((key) => key in schema) ||
    // retrieveSchema adds the value's own keys to an open-ended object
    (!!schema.additionalProperties && schema.additionalProperties !== false))

// resolved schemas, per form (its schemaUtils, which hold the root schema refs point into) and
// per raw schema object; DYNAMIC marks one resolved with its value each time
const DYNAMIC = Symbol('dynamic')
const cache = new WeakMap<object, WeakMap<object, unknown>>()

/**
 * `schemaUtils.retrieveSchema(schema, value)`, remembered for schemas whose resolution doesn't
 * depend on their value. The result is shared: read it, never change it
 */
export const resolveSchema = (schemaUtils: $Any, schema: $Any, value?: unknown): $Any => {
  if (!schema || typeof schema !== 'object' || !schemaUtils) return schema
  let resolved = cache.get(schemaUtils)
  if (!resolved) {
    resolved = new WeakMap()
    cache.set(schemaUtils, resolved)
  }
  const hit = resolved.get(schema)
  if (hit === DYNAMIC) return schemaUtils.retrieveSchema(schema, value)
  if (hit !== undefined) return hit

  const plain = schemaUtils.retrieveSchema(schema)
  if (isValueDependent(schema) || isValueDependent(plain)) {
    resolved.set(schema, DYNAMIC)
    return value === undefined ? plain : schemaUtils.retrieveSchema(schema, value)
  }
  resolved.set(schema, plain)
  return plain
}
