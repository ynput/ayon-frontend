import { matchSorter } from 'match-sorter'
import { isBefore, isValid } from 'date-fns'

const versionSorting = (a, b) => {
  const dateA = new Date(a.value)
  const dateB = new Date(b.value)
  if (!isValid(dateA) || !isValid(dateB)) return 0

  return isBefore(dateB, dateA) ? -1 : 1
}

const getMentionOptions = (type, values = {}, search) => {
  // values  = { users: function, tags: function }

  if (!(type in values)) return []

  const allOptions = values[type]() || []

  // sort versions by version latest first
  if (type === '@@') {
    allOptions.sort(versionSorting)
  }

  if (!search) return allOptions

  // versions should sort by version latest first
  const baseSort = type === '@@' ? versionSorting : undefined

  const filteredOptions = matchSorter(allOptions, search, {
    keys: ['label', 'context'],
    baseSort: baseSort,
  })

  return filteredOptions
}

export default getMentionOptions
