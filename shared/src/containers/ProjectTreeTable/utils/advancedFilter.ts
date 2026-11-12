import type { Option } from '@ynput/ayon-react-components'
import type { QueryCondition, QueryFilter } from '../types/operations'

// The advanced filter is a nested QueryFilter stored in the view settings as `advancedFilter`,
// next to the search bar's `filter`. Its condition keys are the ids of the page's filter options
// (scope prefix included), the same vocabulary as the keys in `filter`.
// The tree is passed on as stored: it can hold operators the server knows and these types don't
// list yet (`startswith`, `endswith`).

// Props of the `AdvancedFilter` module (remote `views`). The addon keeps a copy of these types,
// so change both sides together.
export type AdvancedFilterFieldType =
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'datetime'
  | 'enum'
  | 'list'

export type AdvancedFilterFieldValue = {
  id: string
  label: string
  icon?: string | null
  color?: string | null
  img?: string | null
}

export type AdvancedFilterField = {
  key: string // exact key to store in QueryCondition.key
  label: string
  icon?: string | null
  type: AdvancedFilterFieldType
  scope?: string // undefined on single-scope pages
  scopeLabel?: string
  values?: AdvancedFilterFieldValue[]
  loadValues?: () => Promise<AdvancedFilterFieldValue[]>
  allowsCustomValues?: boolean
}

export type AdvancedFilterProps = {
  value?: QueryFilter
  onChange: (value: QueryFilter | undefined) => void // undefined = cleared
  fields: AdvancedFilterField[]
  disabled?: boolean
  maxDepth?: number
}

const isCondition = (node: QueryCondition | QueryFilter): node is QueryCondition => 'key' in node

// Scope of a filter key by its `<scope>_` prefix, and the key without it
export const resolveFilterKeyScope = <S extends string>(
  key: string,
  scopes: readonly S[],
  fallbackScope?: S,
): { scope: S | null; key: string } => {
  const scope = scopes.find((s) => key.startsWith(`${s}_`))
  if (scope) return { scope, key: key.substring(scope.length + 1) }
  return { scope: fallbackScope ?? null, key }
}

// "empty" / "not empty" on a text field is a pair of conditions (null or ""), shown as one rule
const isTextEmptyPair = (group: QueryFilter): boolean => {
  const [a, b] = group.conditions || []
  if (group.conditions?.length !== 2 || !isCondition(a) || !isCondition(b)) return false
  if (a.key !== b.key || b.value !== '') return false
  return group.operator === 'or'
    ? a.operator === 'isnull' && b.operator === 'eq'
    : a.operator === 'notnull' && b.operator === 'ne'
}

// Number of rules as the editor shows them
export const countAdvancedFilterRules = (tree?: QueryFilter | null): number =>
  (tree?.conditions || []).reduce(
    (count, node) =>
      count + (isCondition(node) || isTextEmptyPair(node) ? 1 : countAdvancedFilterRules(node)),
    0,
  )

// Both filters must match. Each side is kept whole as a nested group, so an `or` root stays an
// `or`. An empty side is skipped: without `b` the result is `a` itself. The result of a merge
// with `b` always has an `and` root, so callers can append conditions to it.
export const mergeQueryFilters = <T extends QueryFilter | undefined>(
  a: T,
  b?: QueryFilter | null,
): T | QueryFilter => {
  if (!b?.conditions?.length) return a
  if (!a?.conditions?.length) return b.operator === 'or' ? { operator: 'and', conditions: [b] } : b
  return { operator: 'and', conditions: [a, b] }
}

// One filter per scope, with the scope prefix removed from the keys. The backend takes one
// filter per entity type, so the tree is split without changing what it means:
// a group of one scope goes whole to that scope, an `and` group of several scopes is split into
// one `and` group per scope, and an `or` group of several scopes can't be expressed and is dropped.
export const splitAdvancedFilterByScope = <S extends string>(
  tree: QueryFilter | null | undefined,
  scopes: readonly S[],
  fallbackScope?: S,
): Partial<Record<S, QueryFilter>> => {
  type Parts<N> = Partial<Record<S, N>>

  const splitGroup = (group: QueryFilter): Parts<QueryFilter> => {
    const children = (group.conditions || []).map((node): Parts<QueryCondition | QueryFilter> => {
      if (!isCondition(node)) return splitGroup(node)
      const { scope, key } = resolveFilterKeyScope(node.key, scopes, fallbackScope)
      if (scope) return { [scope]: { ...node, key } } as Parts<QueryCondition>
      console.warn('Advanced filter: condition without a known scope dropped', node.key)
      return {}
    })
    const groupScopes = scopes.filter((scope) => children.some((child) => child[scope]))

    if (group.operator === 'or' && groupScopes.length > 1) {
      console.warn('Advanced filter: "or" group across entity types dropped', groupScopes)
      return {}
    }

    const parts: Parts<QueryFilter> = {}
    groupScopes.forEach((scope) => {
      parts[scope] = {
        ...group,
        conditions: children.flatMap((child) => child[scope] ?? []),
      }
    })
    return parts
  }

  return tree?.conditions?.length ? splitGroup(tree) : {}
}

const LIST_FIELDS = ['tags', 'assignees']

const getFieldType = (option: Option): AdvancedFilterFieldType | null => {
  const type = option.type
  // same test as clientFilterToQueryFilter, these fields hold lists
  if (type?.startsWith('list_of_') || LIST_FIELDS.some((field) => option.id.includes(field))) {
    return 'list'
  }
  if (type === 'integer' || type === 'float' || type === 'boolean' || type === 'datetime') {
    return type
  }
  if (type === 'dict') return null
  // a text field with a list of values to pick from
  const hasValues = !!option.values?.length || !!option.loadValues
  return hasValues || option.allowsCustomValues === false ? 'enum' : 'string'
}

const toFieldValue = ({ id, label, icon, color, img }: AdvancedFilterFieldValue) => ({
  id,
  label,
  icon,
  color,
  img,
})

// The fields of the advanced filter editor, from the options of the page's search bar.
// `scopes` are the entity types of a multi-scope page, `exclude` the option ids to leave out.
export const buildAdvancedFilterFields = (
  options: Option[],
  { scopes = [], exclude = [] }: { scopes?: string[]; exclude?: string[] } = {},
): AdvancedFilterField[] =>
  options.flatMap((option) => {
    const type = getFieldType(option)
    if (!type || exclude.includes(option.id)) return []

    const group = typeof option.group === 'object' ? option.group : undefined
    const scope = scopes.length > 1 ? scopes.find((s) => s === group?.name) : undefined
    // values are ids (strings), which only text and list fields can be compared with
    const hasValues = type === 'enum' || type === 'list' || type === 'string'
    const { loadValues } = option

    const field: AdvancedFilterField = {
      key: option.id,
      label: option.label,
      icon: option.icon,
      type,
    }
    if (scope) {
      field.scope = scope
      field.scopeLabel = group?.label
    }
    if (hasValues) {
      field.allowsCustomValues = !!option.allowsCustomValues
      if (option.values?.length) field.values = option.values.map(toFieldValue)
      if (loadValues) field.loadValues = async () => (await loadValues()).map(toFieldValue)
    }
    return [field]
  })
