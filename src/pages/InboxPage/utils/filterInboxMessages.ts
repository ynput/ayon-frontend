import type { InboxMessage } from '@/services/inbox/inboxTransform'
import type {
  QueryFilter,
  QueryCondition,
} from '@shared/containers/ProjectTreeTable/types/operations'
import { SEARCH_FILTER_ID } from '@ynput/ayon-react-components'
import type { MessageAuthor } from '../types'

export const applyInboxFilters = (
  messages: InboxMessage[],
  queryFilter: QueryFilter,
): InboxMessage[] => {
  if (!queryFilter?.conditions?.length) return messages
  return messages.filter((message) => evaluateQueryFilter(message, queryFilter))
}

const evaluateQueryFilter = (message: InboxMessage, filter: QueryFilter): boolean => {
  const { conditions = [], operator = 'and' } = filter
  const results = conditions.map((condition) =>
    'key' in condition
      ? evaluateCondition(message, condition as QueryCondition)
      : evaluateQueryFilter(message, condition as QueryFilter),
  )
  return operator === 'and' ? results.every(Boolean) : results.some(Boolean)
}

const getMessageValue = (message: InboxMessage, key: string): unknown => {
  switch (key) {
    case 'project':
      return message.projectName
    case 'activityType':
      return message.activityType
    case 'entityType':
      return message.entityType
    case 'author':
      return (message.author as MessageAuthor | undefined)?.name
    case 'read':
      return message.read
    default:
      return (message as unknown as Record<string, unknown>)[key]
  }
}

const stripLikeWildcards = (pattern: string): string => pattern.replace(/%/g, '')

const getSearchableText = (message: InboxMessage): string => {
  const author = message.author as MessageAuthor | undefined
  return [
    ...message.path,
    message.origin?.name,
    message.origin?.label,
    message.body,
    author?.name,
    author?.attrib?.fullName,
    message.projectName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const evaluateCondition = (message: InboxMessage, condition: QueryCondition): boolean => {
  const { key, operator = 'eq', value } = condition

  if (key === SEARCH_FILTER_ID) {
    const term = (
      typeof value === 'string' ? stripLikeWildcards(value) : String(value ?? '')
    ).toLowerCase()
    if (!term) return true
    return getSearchableText(message).includes(term)
  }

  const messageValue = getMessageValue(message, key)

  switch (operator) {
    case 'eq':
      return messageValue === value || String(messageValue) === String(value)
    case 'ne':
      return messageValue !== value && String(messageValue) !== String(value)
    case 'like': {
      const term = stripLikeWildcards(String(value ?? '')).toLowerCase()
      return String(messageValue ?? '')
        .toLowerCase()
        .includes(term)
    }
    case 'in': {
      const haystack = Array.isArray(value) ? value : [value]
      return haystack.some((v) => String(messageValue) === String(v))
    }
    case 'notin': {
      const haystack = Array.isArray(value) ? value : [value]
      return !haystack.some((v) => String(messageValue) === String(v))
    }
    case 'isnull':
      return messageValue === null || messageValue === undefined
    case 'notnull':
      return messageValue !== null && messageValue !== undefined
    default:
      return true
  }
}
