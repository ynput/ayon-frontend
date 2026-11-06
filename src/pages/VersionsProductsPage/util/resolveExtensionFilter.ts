import type {
  QueryCondition,
  QueryFilter,
} from '@shared/containers/ProjectTreeTable/types/operations'

// Publishing only writes `path` and `template` on a representation, never the
// `extension` attribute, so the filter bar's extension option is matched
// against the end of attrib.path instead. The server treats `like` values as
// literal "contains" text, so the suffix match uses `re` (SQL SIMILAR TO), which
// matches the whole value: "exr" does not match "render.exr.json".
const EXTENSION_KEY = 'extension'

// SIMILAR TO is case-sensitive, so letters match either case; its
// metacharacters are escaped so they match literally
const toSimilarTo = (text: string): string =>
  Array.from(text, (char) => {
    const lower = char.toLowerCase()
    const upper = char.toUpperCase()
    if (lower !== upper) return `[${lower}${upper}]`
    return /[\\%_|*+?{}()[\]]/.test(char) ? `\\${char}` : char
  }).join('')

const toPathCondition = (value: unknown): QueryCondition | null => {
  // custom values arrive wrapped in % wildcards, and users may type ".exr" or "exr"
  const extension = String(value ?? '')
    .replace(/%/g, '')
    .trim()
    .replace(/^\.+/, '')
  if (!extension) return null
  return { key: 'attrib.path', operator: 're', value: `%.${toSimilarTo(extension)}` }
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
