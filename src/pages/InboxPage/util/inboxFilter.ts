import type { QueryCondition, QueryFilter } from '@shared/api'
import { buildBackendFilterObject } from '@shared/containers/Feed/helpers/buildBackendFilter'

// reference types the inbox shows: everything the user is referenced by, except their own authorship
export const INBOX_REFERENCE_TYPES = ['mention', 'watching', 'relation']

const IMPORTANT_REFERENCE_TYPES = ['mention', 'watching']

// the reason chip drives the referenceTypes argument, so it must never reach the
// QueryFilter - `reason` is not a whitelisted column and the backend would reject it
export const REASON_FILTER_KEY = 'reason'

const stripUiKey = (filter: QueryFilter | undefined, key: string): QueryFilter | undefined =>
  filter && {
    ...filter,
    conditions: (filter.conditions || []).filter((c) => !('key' in c) || c.key !== key),
  }

export const getInboxReferenceTypes = (
  uiFilter: QueryFilter | undefined,
  isImportant: boolean | null,
): string[] => {
  const allowed = isImportant === true ? IMPORTANT_REFERENCE_TYPES : INBOX_REFERENCE_TYPES

  const selected = (uiFilter?.conditions || []).flatMap((c) =>
    'key' in c && c.key === REASON_FILTER_KEY && Array.isArray(c.value)
      ? (c.value as string[])
      : [],
  )

  const valid = selected.filter((type) => allowed.includes(type))
  return valid.length ? valid : allowed
}

// entity_path and entity_name are useless on inbox rows: user references have no entity_id,
// so the path join yields NULL, and entity_name holds the recipient's user name.
// activity_data.parents has no text column either - `like` casts the whole array to text
// with ->>, so the folder names are matched inside the raw JSON.
const TEXT_SEARCH_KEYS = [
  'body',
  'activity_data.origin.name',
  'activity_data.origin.label',
  'activity_data.parents',
]

// matching parents as raw JSON also matches its keys and type values, so these words
// would hit nearly every row - the other three fields still search them
const PARENTS_STOPWORDS = new Set([
  'id',
  'name',
  'label',
  'type',
  'origin',
  'parents',
  'folder',
  'task',
  'version',
  'product',
  'workfile',
  'representation',
])

const searchKeysFor = (term: string): string[] => {
  const skipParents = term.length < 3 || PARENTS_STOPWORDS.has(term.toLowerCase())
  return skipParents
    ? TEXT_SEARCH_KEYS.filter((k) => k !== 'activity_data.parents')
    : TEXT_SEARCH_KEYS
}

const matchesAnyField = (term: string): QueryFilter => ({
  operator: 'or',
  conditions: searchKeysFor(term).map((key) => ({
    key,
    operator: 'like' as const,
    value: `%${term}%`,
  })),
})

// "050_0070 anim" must match folder AND task, so each word is required separately
const expandTextSearch = (node: QueryCondition | QueryFilter): QueryCondition | QueryFilter => {
  if ('key' in node) {
    if (node.key !== 'body' || node.operator !== 'like') return node

    const terms = String(node.value ?? '')
      .replace(/^%|%$/g, '')
      .split(/\s+/)
      .filter(Boolean)

    if (!terms.length) return node
    if (terms.length === 1) return matchesAnyField(terms[0])

    return { operator: 'and', conditions: terms.map(matchesAnyField) }
  }

  return { ...node, conditions: (node.conditions || []).map(expandTextSearch) }
}

type BuildInboxFilterArgs = {
  userName: string
  isActive: boolean
  isImportant: boolean | null
  isUnread?: boolean
  uiFilter?: QueryFilter
}

// Rebuilds the get_user_inbox() predicates as a QueryFilter so the per-project
// `activities` resolver returns the same rows the `inbox` resolver would.
export const buildInboxFilter = ({
  userName,
  isActive,
  isImportant,
  isUnread,
  uiFilter,
}: BuildInboxFilterArgs): string => {
  const conditions: (QueryCondition | QueryFilter)[] = [
    { key: 'entity_type', operator: 'eq', value: 'user' },
    // string, not boolean: `eq` with a boolean compiles to a jsonb coalesce that breaks real columns
    { key: 'active', operator: 'eq', value: isActive ? 'true' : 'false' },
    { key: 'activity_data.author', operator: 'ne', value: userName },
  ]

  // read is a JSON path, so the boolean-eq coalesce is valid here
  if (isUnread) conditions.push({ key: 'reference_data.read', operator: 'eq', value: false })

  if (isImportant === true) {
    conditions.push({ key: 'reference_type', operator: 'in', value: IMPORTANT_REFERENCE_TYPES })
    conditions.push({ key: 'activity_type', operator: 'ne', value: 'status.change' })
  } else if (isImportant === false) {
    conditions.push({
      operator: 'or',
      conditions: [
        { key: 'reference_type', operator: 'notin', value: IMPORTANT_REFERENCE_TYPES },
        { key: 'activity_type', operator: 'eq', value: 'status.change' },
      ],
    })
  }

  const translatedUiFilter = buildBackendFilterObject(stripUiKey(uiFilter, REASON_FILTER_KEY))
  if (translatedUiFilter) conditions.push(expandTextSearch(translatedUiFilter))

  return JSON.stringify({ operator: 'and', conditions })
}

// Inbox-local, not the shared feed map: the inbox groups `reviewable` rows in with
// publishes, so the Versions chip must not hide them.
// assignee.reassign is synthesised client-side and is not a backend type - never send it.
const INBOX_ACTIVITY_TYPES: Record<string, string[]> = {
  comments: ['comment'],
  versions: ['version.publish', 'reviewable'],
  updates: [
    'status.change',
    'assignee.add',
    'assignee.remove',
    'attrib.change',
    'tags.change',
    'subtype.change',
  ],
  checklists: ['checklist'],
}

// null means no restriction: any default list would drop types the unfiltered inbox shows.
export const getInboxActivityTypes = (uiFilter?: QueryFilter): string[] | null => {
  const types = new Set<string>()

  for (const condition of uiFilter?.conditions || []) {
    if (!('key' in condition) || condition.value !== true) continue
    const mapped = INBOX_ACTIVITY_TYPES[condition.key]
    if (mapped) mapped.forEach((type) => types.add(type))
  }

  return types.size ? Array.from(types) : null
}
