import { $Any } from '@types'

/** Whether `arr1` starts with all of `arr2`: a path inside another one */
const arrayStartsWith = (arr1: $Any, arr2: $Any) => {
  if ((arr2 || []).length > (arr1 || []).length) return false
  if ((arr2 || []).length === 0) return true
  for (let i = 0; i < arr2.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

const arrayMatchingRegex = new RegExp(/([\w_+]+?)_[\d+]_[\d]*\w+$/)

const matchesFilterKeys = (
  searchText: string,
  filterKeys: { [key: string]: string[] },
  addonName: string,
  id: string,
): boolean => {
  if (searchText === undefined || searchText === '') {
    return true
  }

  if (filterKeys === undefined || Object.keys(filterKeys).length == 0) {
    return true
  }

  if (filterKeys[addonName] === undefined || filterKeys[addonName].length === 0) {
    return false
  }

  if (id == 'root') {
    return true
  }

  for (const key of filterKeys[addonName]) {
    let sanitizedKey = key
    const matches = getArrayMatch(key)
    if (matches) {
      sanitizedKey = matches[1]
    }
    if (id.indexOf(sanitizedKey) !== -1 || sanitizedKey.indexOf(id) !== -1) {
      return true
    }
  }

  return false
}

const getArrayMatch = (key: string) => {
  return key.match(arrayMatchingRegex)
}

export { arrayStartsWith, matchesFilterKeys }
