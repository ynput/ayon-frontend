import type { QueryCondition, QueryFilter } from '@shared/api'
import { buildBackendFilterObject } from '@shared/containers/Feed/helpers/buildBackendFilter'

// reference types the inbox shows: everything the user is referenced by, except their own authorship
export const INBOX_REFERENCE_TYPES = ['mention', 'watching', 'relation']

const IMPORTANT_REFERENCE_TYPES = ['mention', 'watching']

// neither is a whitelisted column, so they must never reach the QueryFilter
export const REASON_FILTER_KEY = 'reason'
export const REVIEWS_FILTER_KEY = 'reviews'

const REVIEW_FEEDBACK_VALUES = ['approve', 'request_changes']

const stripUiKeys = (filter: QueryFilter | undefined, keys: string[]): QueryFilter | undefined =>
  filter && {
    ...filter,
    conditions: (filter.conditions || []).filter((c) => !('key' in c) || !keys.includes(c.key)),
  }

const getSelectedValues = (uiFilter: QueryFilter | undefined, key: string): string[] =>
  (uiFilter?.conditions || []).flatMap((c) =>
    'key' in c && c.key === key && Array.isArray(c.value) ? (c.value as string[]) : [],
  )

const getSelectedReasons = (uiFilter: QueryFilter | undefined): string[] =>
  getSelectedValues(uiFilter, REASON_FILTER_KEY)

export const getInboxReferenceTypes = (
  uiFilter: QueryFilter | undefined,
  isImportant: boolean | null,
): string[] => {
  const allowed = isImportant === true ? IMPORTANT_REFERENCE_TYPES : INBOX_REFERENCE_TYPES

  const valid = getSelectedReasons(uiFilter).filter((type) => allowed.includes(type))
  return valid.length ? valid : allowed
}

// not entity_path or entity_name: on inbox rows the first is always NULL and the second
// holds the recipient. parents has no text column, so `like` matches it as raw JSON.
const TEXT_SEARCH_KEYS = [
  'body',
  'activity_data.origin.name',
  'activity_data.origin.label',
  'activity_data.parents',
]

// raw JSON also contains its own keys and type values, so these would hit nearly every row
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

// rebuilds the get_user_inbox() predicates so `activities` returns the same rows
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

  // assignments are mention references too, so the Mentioned reason must stay comments-only
  if (getSelectedReasons(uiFilter).includes('mention')) {
    conditions.push({
      operator: 'or',
      conditions: [
        { key: 'reference_type', operator: 'ne', value: 'mention' },
        { key: 'activity_type', operator: 'eq', value: 'comment' },
      ],
    })
  }

  // feedback narrows only review rows, so combining e.g. Comments + Approved keeps the comments
  const feedback = getSelectedValues(uiFilter, REVIEWS_FILTER_KEY).filter((v) =>
    REVIEW_FEEDBACK_VALUES.includes(v),
  )
  if (feedback.length) {
    conditions.push({
      operator: 'or',
      conditions: [
        { key: 'activity_type', operator: 'ne', value: 'version.review' },
        { key: 'activity_data.feedback', operator: 'in', value: feedback },
      ],
    })
  }

  const translatedUiFilter = buildBackendFilterObject(
    stripUiKeys(uiFilter, [REASON_FILTER_KEY, REVIEWS_FILTER_KEY]),
  )
  if (translatedUiFilter) conditions.push(expandTextSearch(translatedUiFilter))

  return JSON.stringify({ operator: 'and', conditions })
}

// not the shared feed map: the inbox shows `reviewable` under Versions, and
// assignee.reassign is synthesised client-side so it must never be sent
const INBOX_ACTIVITY_TYPES: Record<string, string[]> = {
  comments: ['comment'],
  versions: ['version.publish', 'reviewable'],
  reviews: ['version.review'],
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
    if (!('key' in condition)) continue
    // boolean chips carry `true`, the reviews chip carries a value list
    const isActive =
      condition.value === true || (Array.isArray(condition.value) && condition.value.length > 0)
    if (!isActive) continue
    const mapped = INBOX_ACTIVITY_TYPES[condition.key]
    if (mapped) mapped.forEach((type) => types.add(type))
  }

  return types.size ? Array.from(types) : null
}
