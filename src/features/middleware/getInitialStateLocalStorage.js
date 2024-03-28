const getInitialStateLocalStorage = (key, initial, types) => {
  const value = localStorage.getItem(key)
  if (!value || value === 'null' || value === 'undefined') {
    return initial || (types && types[0]) || ''
  } else {
    try {
      let valueParsed = JSON.parse(value)

      if (initial) {
        if (typeof initial !== typeof valueParsed) {
          valueParsed = initial
        } else if (Array.isArray(initial) && !Array.isArray(valueParsed)) {
          valueParsed = initial
        } else if (!Array.isArray(initial) && Array.isArray(valueParsed)) {
          valueParsed = initial
        }
      }

      if (!types?.find((type) => type === valueParsed) && types?.length) {
        valueParsed = types[0]
      }

      return valueParsed
    } catch (error) {
      // remove invalid value
      localStorage.removeItem(key)
      return initial || (types && types[0]) || null
    }
  }
}

export default getInitialStateLocalStorage
