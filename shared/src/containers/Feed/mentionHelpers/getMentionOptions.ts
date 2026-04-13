// @ts-nocheck

import { matchSorter } from 'match-sorter'
import { isBefore, isValid } from 'date-fns'
import { isSameMinute } from 'date-fns'

const versionSorting = (a, b) => {
  const itemA = a.item || a
  const itemB = b.item || b
  const dateA = new Date(itemA.createdAt)
  const dateB = new Date(itemB.createdAt)

  const bothValid = isValid(dateA) && isValid(dateB)
  const sameMinute = bothValid && isSameMinute(dateA, dateB)
  if (!bothValid || sameMinute) {
    // If both dates are invalid or the same minute, sort by relevance
    if (itemA.relevance > itemB.relevance) {
      return -1
    } else if (itemA.relevance < itemB.relevance) {
      return 1
    } else {
      // If relevance scores are the same, sort alphabetically by label
      return String(itemB.label).localeCompare(String(itemA.label))
    }
  } else {
    // Sort by date
    return isBefore(dateB, dateA) ? -1 : 1
  }
}

// Sort by relevance score, then alphabetically by label
const sortByRelevanceThenAlpha = (a, b) => {
  if (a.relevance > b.relevance) {
    return -1
  } else if (a.relevance < b.relevance) {
    return 1
  } else {
    return a.label?.localeCompare(b.label)
  }
}

// Prefixes that filter the @ mention list to a specific type
const TYPE_PREFIXES = ['team:', 'user:']

/**
 * Parse a search string for type prefix filtering.
 * e.g. "team:comp" -> { typeFilter: 'team', search: 'comp' }
 * e.g. "john"      -> { typeFilter: null, search: 'john' }
 */
export const parseMentionPrefix = (search?: string) => {
  if (!search) return { typeFilter: null, search: undefined }

  for (const prefix of TYPE_PREFIXES) {
    if (search.startsWith(prefix)) {
      return {
        typeFilter: prefix.slice(0, -1), // 'team:' -> 'team'
        search: search.slice(prefix.length) || undefined,
      }
    }
  }

  return { typeFilter: null, search }
}

const getMentionOptions = (type, values = {}, search) => {
  // values  = { users: function, tags: function }

  if (!(type in values)) return []

  const allOptions = values[type]() || []

  // default sorting
  let baseSort = sortByRelevanceThenAlpha

  // versions should sort by version latest first
  if (type === '@@') baseSort = versionSorting

  // Parse prefix filter (e.g. "team:comp" -> filter to teams, search "comp")
  const { typeFilter, search: actualSearch } = parseMentionPrefix(search)

  // Filter by type prefix if present
  const filteredByType = typeFilter
    ? allOptions.filter((opt) => opt.type === typeFilter)
    : allOptions

  if (!actualSearch) return filteredByType.sort(baseSort)

  const filteredOptions = matchSorter(filteredByType, actualSearch, {
    keys: ['label', 'context', 'keywords'],
    baseSort: baseSort,
  })

  return filteredOptions
}

export default getMentionOptions
