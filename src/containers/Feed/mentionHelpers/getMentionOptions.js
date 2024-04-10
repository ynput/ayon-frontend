import { matchSorter } from 'match-sorter'

const getMentionOptions = (type, values = {}, search) => {
  // values  = { users: function, tags: function }

  if (!(type in values)) return []

  const allOptions = values[type]() || []

  if (!search) return allOptions

  const filteredOptions = matchSorter(allOptions, search, { keys: ['label'] })

  return filteredOptions
}

export default getMentionOptions
