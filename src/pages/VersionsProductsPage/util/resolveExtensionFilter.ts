import type {
  QueryCondition,
  QueryFilter,
} from '@shared/containers/ProjectTreeTable/types/operations'

// Publishing only writes `path` and `template` on a representation, never the
// `extension` attribute, so the filter bar's extension option is matched
// against the end of attrib.path instead. The pattern is anchored to the end
// so "exr" does not match "render.exr.json" (`like` is case-insensitive server-side).
const EXTENSION_KEY = 'extension'

const toPathCondition = (value: unknown): QueryCondition | null => {
  // custom values arrive wrapped in % wildcards, and users may type ".exr" or "exr"
  const extension = String(value ?? '')
    .replace(/%/g, '')
    .trim()
    .replace(/^\.+/, '')
  if (!extension) return null
  // escape the remaining LIKE wildcards so they match literally
  const escaped = extension.replace(/[\\_]/g, '\\$&')
  return { key: 'attrib.path', operator: 'like', value: `%.${escaped}` }
}

export const resolveExtensionFilter = (filter: QueryFilter): QueryFilter => ({
  ...filter,
  conditions: filter.conditions?.flatMap((condition): (QueryCondition | QueryFilter)[] => {
    if (!('key' in condition)) return [resolveExtensionFilter(condition)]
    if (condition.key !== EXTENSION_KEY) return [condition]

    const values = Array.isArray(condition.value) ? condition.value : [condition.value]
    const conditions = values.map(toPathCondition).filter((c): c is QueryCondition => c !== null)
    if (!conditions.length) return []
    return conditions.length === 1 ? conditions : [{ conditions, operator: 'or' }]
  }),
})
