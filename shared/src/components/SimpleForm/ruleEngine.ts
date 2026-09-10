import type { FormFieldPatch, QueryCondition, QueryFilter, SimpleFormField } from '@shared/api'

// Client-side counterpart to ayon_server/sqlfilter.py's build_filter/build_condition -
// evaluates the same QueryFilter/QueryCondition model, but against the form's own
// in-memory values instead of building SQL. A condition's `key` is the literal `name`
// of an earlier field in the same form (never a JSON path), matching how the backend
// builds these rules (see ayon_server/forms/simple_form.py's _condition_field_names).

type FormValues = Record<string, unknown>

const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === '' ||
  (Array.isArray(value) && value.length === 0)

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : isEmpty(value) ? [] : [value]

const isQueryFilter = (node: QueryCondition | QueryFilter): node is QueryFilter =>
  'conditions' in node

export const evaluateCondition = (condition: QueryCondition, values: FormValues): boolean => {
  const fieldValue = values[condition.key]
  const target = condition.value
  const operator = condition.operator || 'eq'

  switch (operator) {
    case 'isnull':
      return isEmpty(fieldValue)
    case 'notnull':
      return !isEmpty(fieldValue)
    case 'eq':
      return fieldValue === target
    case 'ne':
      return fieldValue !== target
    case 'lt':
      return typeof fieldValue === 'number' && typeof target === 'number' && fieldValue < target
    case 'gt':
      return typeof fieldValue === 'number' && typeof target === 'number' && fieldValue > target
    case 'lte':
      return typeof fieldValue === 'number' && typeof target === 'number' && fieldValue <= target
    case 'gte':
      return typeof fieldValue === 'number' && typeof target === 'number' && fieldValue >= target
    case 'like': {
      if (typeof fieldValue !== 'string' || typeof target !== 'string') return false
      // SQL ILIKE wildcards (%, _) - simplified, case-insensitive
      const pattern = target
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/%/g, '.*')
        .replace(/_/g, '.')
      try {
        return new RegExp(`^${pattern}$`, 'i').test(fieldValue)
      } catch {
        return false
      }
    }
    case 'in':
      return Array.isArray(target) && target.includes(fieldValue as never)
    case 'notin':
      return Array.isArray(target) && !target.includes(fieldValue as never)
    case 'includes':
      return toArray(fieldValue).includes(target as never)
    case 'excludes':
      return !toArray(fieldValue).includes(target as never)
    case 'includesall':
      return Array.isArray(target) && target.every((v) => toArray(fieldValue).includes(v as never))
    case 'excludesall':
      return !(Array.isArray(target) && target.every((v) => toArray(fieldValue).includes(v as never)))
    case 'includesany':
      return Array.isArray(target) && target.some((v) => toArray(fieldValue).includes(v as never))
    case 'excludesany':
      return !(Array.isArray(target) && target.some((v) => toArray(fieldValue).includes(v as never)))
    default:
      return false
  }
}

export const evaluateFilter = (filter: QueryFilter, values: FormValues): boolean => {
  const conditions = filter.conditions || []
  if (conditions.length === 0) return true

  const results = conditions.map((node) =>
    isQueryFilter(node) ? evaluateFilter(node, values) : evaluateCondition(node, values),
  )

  return (filter.operator || 'and') === 'and' ? results.every(Boolean) : results.some(Boolean)
}

export type FieldPatchMap = Record<string, FormFieldPatch>

/** Merge every matching rule's `set` for each field, in rule order (later rules win). */
export const computeFieldPatches = (fields: SimpleFormField[], values: FormValues): FieldPatchMap => {
  const patches: FieldPatchMap = {}

  for (const field of fields) {
    if (!field.rules?.length) continue

    let merged: FormFieldPatch | undefined
    for (const rule of field.rules) {
      if (evaluateFilter(rule.when, values)) {
        merged = { ...merged, ...rule.set }
      }
    }
    if (merged) patches[field.name] = merged
  }

  return patches
}

const TEMPLATE_VAR_PATTERN = /\{\{\s*([^{}\s]+)\s*\}\}/g

/** Collect every `{{fieldName}}` reference out of a (possibly nested) value. */
export const extractTemplateVars = (value: unknown): string[] => {
  const names = new Set<string>()

  const walk = (node: unknown) => {
    if (typeof node === 'string') {
      for (const match of node.matchAll(TEMPLATE_VAR_PATTERN)) names.add(match[1])
    } else if (Array.isArray(node)) {
      node.forEach(walk)
    } else if (node && typeof node === 'object') {
      Object.values(node as Record<string, unknown>).forEach(walk)
    }
  }

  walk(value)
  return [...names]
}

/**
 * Substitute `{{fieldName}}` references with values from `values`.
 * A string that is *only* a single template reference resolves to the referenced
 * value as-is (preserving its type); a template embedded in a larger string is
 * stringified in place.
 */
export const resolveTemplates = (value: unknown, values: FormValues): unknown => {
  if (typeof value === 'string') {
    const wholeMatch = value.match(/^\{\{\s*([^{}\s]+)\s*\}\}$/)
    if (wholeMatch) return values[wholeMatch[1]]

    return value.replace(TEMPLATE_VAR_PATTERN, (_match, name: string) => {
      const resolved = values[name]
      return isEmpty(resolved) ? '' : String(resolved)
    })
  }
  if (Array.isArray(value)) return value.map((v) => resolveTemplates(v, values))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, resolveTemplates(v, values)]),
    )
  }
  return value
}
