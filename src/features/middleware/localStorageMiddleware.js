const localStorageMiddleware = (types) => () => (next) => (action) => {
  const matchedType = types[action.type]
  if (matchedType && Array.isArray(matchedType)) {
    matchedType.forEach(({ key, value = action.payload }) => {
      localStorage.setItem(key, JSON.stringify(value))
    })
  }

  return next(action)
}

export default localStorageMiddleware
