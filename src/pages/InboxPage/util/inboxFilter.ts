import type { QueryCondition, QueryFilter } from '@shared/api'
import { filterActivityTypes } from '@shared/api'
import { buildBackendFilterObject } from '@shared/containers/Feed/helpers/buildBackendFilter'

// reference types the inbox shows: everything the user is referenced by, except their own authorship
export const INBOX_REFERENCE_TYPES = ['mention', 'watching', 'relation']

const IMPORTANT_REFERENCE_TYPES = ['mention', 'watching']

type BuildInboxFilterArgs = {
  userName: string
  isActive: boolean
  isImportant: boolean | null
  uiFilter?: QueryFilter
}

// Rebuilds the get_user_inbox() predicates as a QueryFilter so the per-project
// `activities` resolver returns the same rows the `inbox` resolver would.
export const buildInboxFilter = ({
  userName,
  isActive,
  isImportant,
  uiFilter,
}: BuildInboxFilterArgs): string => {
  const conditions: (QueryCondition | QueryFilter)[] = [
    { key: 'entity_type', operator: 'eq', value: 'user' },
    // string, not boolean: `eq` with a boolean compiles to a jsonb coalesce that breaks real columns
    { key: 'active', operator: 'eq', value: isActive ? 'true' : 'false' },
    { key: 'activity_data.author', operator: 'ne', value: userName },
  ]

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

  const translatedUiFilter = buildBackendFilterObject(uiFilter)
  if (translatedUiFilter) conditions.push(translatedUiFilter)

  return JSON.stringify({ operator: 'and', conditions })
}

// getFilterActivityTypes falls back to a list that omits reviewable/assignee.reassign,
// which the inbox does show - so return null (no restriction) when no type chip is active.
export const getInboxActivityTypes = (uiFilter?: QueryFilter): string[] | null => {
  const types = new Set<string>()

  for (const condition of uiFilter?.conditions || []) {
    if (!('key' in condition) || condition.value !== true) continue
    const mapped = filterActivityTypes[condition.key]
    if (mapped) mapped.forEach((type) => types.add(type))
  }

  return types.size ? Array.from(types) : null
}
