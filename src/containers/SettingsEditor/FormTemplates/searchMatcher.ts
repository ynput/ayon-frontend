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
    const matches = getArrayMatch(key);
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

export { matchesFilterKeys }
