const localStorageMiddleware = (types) => () => (next) => (action) => {
  const matchedType = types[action.type]
  if (matchedType && Array.isArray(matchedType)) {
    matchedType.forEach(({ key, value, payload }) => {
      let val =
        value ||
        (payload && action.payload[payload] !== undefined
          ? action.payload[payload]
          : action.payload)

      if (val !== undefined && key) {
        localStorage.setItem(key, JSON.stringify(val))
      }
    })
  }

  return next(action)
}

export default localStorageMiddleware
