import type { QueryCondition, QueryFilter } from '@shared/api'
import { filterActivityTypes } from '@shared/api'

// UI chip keys handled by getFilterActivityTypes → activityTypes arg.
// Must not leak into the QueryFilter (not in backend whitelist).
const UI_ONLY_KEYS = new Set(
  Object.keys(filterActivityTypes).filter((k) => k !== 'activity'),
)

const UI_KEY_TO_BACKEND_KEY: Record<string, string> = {
  has_attachments: 'activity_data.files',
}

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => {
  return !!c && 'key' in c
}

const translateCondition = (c: QueryCondition): QueryCondition | QueryFilter | null => {
  const mappedKey = UI_KEY_TO_BACKEND_KEY[c.key] ?? c.key

  if (c.key === 'has_attachments') {
    return c.value ? { key: mappedKey, operator: 'ne', value: [] } : null
  }

  if (c.key === 'in_review_session') {
    return c.value ? { key: 'activity_data.entityList', operator: 'notnull' } : null
  }

  if (c.key === 'category') {
    const values = Array.isArray(c.value) ? (c.value as string[]) : []
    const hasNone = values.includes('__none__')
    const named = values.filter((v) => v !== '__none__')
    const nullCond: QueryFilter = {
      operator: 'or',
      conditions: [
        { key: 'activity_data.category', operator: 'isnull' },
        { key: 'activity_data.category', operator: 'eq', value: '' },
      ],
    }
    const namedCond: QueryCondition = {
      key: 'activity_data.category',
      operator: 'in',
      value: named,
    }
    if (hasNone && named.length) return { operator: 'or', conditions: [nullCond, namedCond] }
    if (hasNone) return nullCond
    if (named.length) return namedCond
    return null
  }

  if (c.key === 'body' && c.operator === 'like' && typeof c.value === 'string') {
    return { ...c, key: mappedKey, value: `%${c.value}%` }
  }

  // "Author" UI filter matches actor OR assignee, so picking a user surfaces
  // both their comments/versions AND assignment events involving them.
  if (c.key === 'author') {
    return {
      operator: 'or',
      conditions: [
        { ...c, key: 'activity_data.author' },
        { ...c, key: 'activity_data.assignee' },
      ],
    }
  }

  return { ...c, key: mappedKey }
}

const translate = (node: QueryCondition | QueryFilter): QueryCondition | QueryFilter | null => {
  if (isCondition(node)) {
    if (UI_ONLY_KEYS.has(node.key)) return null
    return translateCondition(node)
  }

  const translated = (node.conditions || [])
    .map((c) => translate(c))
    .filter((c): c is QueryCondition | QueryFilter => c !== null)

  if (translated.length === 0) return null

  return { operator: node.operator || 'and', conditions: translated }
}

export const buildBackendFilter = (filter: QueryFilter | undefined): string | undefined => {
  if (!filter || !filter.conditions?.length) return undefined

  const translated = translate(filter)
  if (!translated) return undefined

  return JSON.stringify(translated)
}

export default buildBackendFilter
