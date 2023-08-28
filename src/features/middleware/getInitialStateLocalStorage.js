const getInitialStateLocalStorage = (key, types = []) => {
  const value = localStorage.getItem(key)
  if (value === null) {
    return types[0]
  } else {
    const valueParsed = JSON.parse(value)
    // check it matches one of the types
    // otherwise take first type as default
    if (
      types.find(
        (type) =>
          type === valueParsed || (typeof type === 'object' && typeof valueParsed === 'object'),
      )
    ) {
      return valueParsed
    }
    return types[0]
  }
}

export default getInitialStateLocalStorage
