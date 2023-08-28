const localStorageMiddleware = (types) => () => (next) => (action) => {
  const matchedType = types[action.type]
  if (matchedType) {
    localStorage.setItem(matchedType, JSON.stringify(action.payload))
  }

  return next(action)
}

export default localStorageMiddleware
