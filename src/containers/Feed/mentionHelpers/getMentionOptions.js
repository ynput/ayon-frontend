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

const getMentionOptions = (type, values = {}, search) => {
  // values  = { users: function, tags: function }

  if (!(type in values)) return []

  const allOptions = values[type]() || []

  // default sorting
  let baseSort = sortByRelevanceThenAlpha

  // versions should sort by version latest first
  if (type === '@@') baseSort = versionSorting

  if (!search) return allOptions.sort(baseSort)

  const filteredOptions = matchSorter(allOptions, search, {
    keys: ['label', 'context', 'keywords'],
    baseSort: baseSort,
  })

  return filteredOptions
}

export default getMentionOptions
