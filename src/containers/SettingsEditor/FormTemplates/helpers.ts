const matchesFilterKeys = (
  filterKeys: { [key: string]: string[] },
  addonName: string,
  id: string,
): boolean => {
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
    if (id.indexOf(key) !== -1 || key.indexOf(id) !== -1) {
      return true
    }
  }

  return false
}

export { matchesFilterKeys }
