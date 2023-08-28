const getInitialStateLocalStorage = (key, initial, types) => {
  const value = localStorage.getItem(key)
  if (!value || value === null || value === 'undefined') {
    return initial || (types && types[0]) || ''
  } else {
    try {
      const valueParsed = JSON.parse(value)
      // check it matches one of the types
      // otherwise take first type as default
      if (types?.find((type) => type === valueParsed) || !types?.length) {
        return valueParsed
      }
      return types[0]
    } catch (error) {
      // remove invalid value
      localStorage.removeItem(key)
      return initial || (types && types[0]) || null
    }
  }
}

export default getInitialStateLocalStorage
