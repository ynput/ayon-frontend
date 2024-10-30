
  const matchesFilterKeys = (filterKeys: string[], id: string): boolean => {
    if (filterKeys.length === 0) {
      return true
    }
    if (id == 'root') {
      return true
    }

    id == 'root_publish_ValidateAbsoluteDataBlockPaths' && console.log('checking...', filterKeys, id)
    for (const key of filterKeys) {
      if (id.indexOf(key) !== -1 || key.indexOf(id) !== -1) {
        console.log('match! ', id, key)
        return true
      }
    }

    return false
  }

  export { matchesFilterKeys }