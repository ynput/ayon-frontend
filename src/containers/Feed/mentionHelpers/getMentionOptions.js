import { matchSorter } from 'match-sorter'
import { isBefore, isValid } from 'date-fns'

const versionSorting = (a, b) => {
  const itemA = a.item || a
  const itemB = b.item || b
  const dateA = new Date(itemA.createdAt)
  const dateB = new Date(itemB.createdAt)
  if (!isValid(dateA) || !isValid(dateB)) return 0

  return isBefore(dateB, dateA) ? -1 : 15
}

const userSorting = (a, b) => {
  const itemA = a.item || a
  const itemB = b.item || b
  if (itemA.onEntities && !itemB.onEntities) {
    return -1
  } else if (!itemA.onEntities && itemB.onEntities) {
    return 1
  } else if (itemA.onSameTeam && !itemB.onSameTeam) {
    return -1
  } else if (!itemA.onSameTeam && itemB.onSameTeam) {
    return 1
  } else {
    if (!itemA.label) console.log(a)
    // If both users have the same onEntities and onSameTeam value, sort by fullName
    return itemA.label?.localeCompare(itemB.label)
  }
}

const getMentionOptions = (type, values = {}, search) => {
  // values  = { users: function, tags: function }

  if (!(type in values)) return []

  const allOptions = values[type]() || []

  let baseSort
  // users should sort by assigned to task first
  if (type === '@') baseSort = userSorting
  // versions should sort by version latest first
  else if (type === '@@') baseSort = versionSorting
  else baseSort = () => 0

  if (!search) return allOptions.sort(baseSort)

  const filteredOptions = matchSorter(allOptions, search, {
    keys: ['label', 'context'],
    baseSort: baseSort,
  })

  return filteredOptions
}

export default getMentionOptions
