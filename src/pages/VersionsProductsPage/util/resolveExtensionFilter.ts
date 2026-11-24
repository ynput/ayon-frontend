import type {
  QueryCondition,
  QueryFilter,
} from '@shared/containers/ProjectTreeTable/types/operations'

// Publishing only writes `path` and `template` on a representation, never the
// `extension` attribute, so the extension filter (search bar or advanced filter) is
// matched against the end of attrib.path instead. The pattern is anchored to the end
// so "exr" does not match "render.exr.json" (`like` is case-insensitive server-side).
const EXTENSION_KEY = 'extension'
const PATH_KEY = 'attrib.path'

// negated operators match paths that do not end with the extension
const NEGATED = ['ne', 'notin', 'notlike']

const toExtension = (value: unknown): string =>
  String(value ?? '')
    // a text pattern arrives wrapped in % wildcards, from the advanced filter with its
    // \ % and _ escaped
    .replace(/^%+|%+$/g, '')
    .replace(/\\([\\%_])/g, '$1')
    .replace(/%/g, '')
    .trim()
    // users may type ".exr" or "exr"
    .replace(/^\.+/, '')

// the path pattern of an extension: "starts with" matches the start of the extension,
// "ends with" the end of the path, anything else the whole extension
const toPathPattern = (extension: string, operator?: string): string => {
  // escape the LIKE wildcards so they match literally
  const escaped = extension.replace(/[\\%_]/g, '\\$&')
  if (operator === 'endswith') return `%${escaped}`
  if (operator === 'startswith') return `%.${escaped}%`
  return `%.${escaped}`
}

const resolveCondition = (condition: QueryCondition): (QueryCondition | QueryFilter)[] => {
  const { operator } = condition
  // empty / not empty: the path is
  if (operator === 'isnull' || operator === 'notnull') return [{ key: PATH_KEY, operator }]

  const isNegated = NEGATED.includes(operator ?? '')
  const values = Array.isArray(condition.value) ? condition.value : [condition.value]
  const conditions = values
    .map(toExtension)
    .filter(Boolean)
    .map(
      (extension): QueryCondition => ({
        key: PATH_KEY,
        operator: isNegated ? 'notlike' : 'like',
        value: toPathPattern(extension, operator),
      }),
    )
  if (conditions.length <= 1) return conditions
  return [{ conditions, operator: isNegated ? 'and' : 'or' }]
}

export const resolveExtensionFilter = (filter: QueryFilter): QueryFilter => ({
  ...filter,
  conditions: filter.conditions?.flatMap((condition): (QueryCondition | QueryFilter)[] => {
    if (!('key' in condition)) return [resolveExtensionFilter(condition)]
    if (condition.key !== EXTENSION_KEY) return [condition]
    return resolveCondition(condition)
  }),
})
