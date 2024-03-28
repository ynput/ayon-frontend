// This middleware is used to save the state to the local storage
// It intercepts the action and saves the state to the local storage
// if the action type matches the type specified in the types object

const localStorageMiddleware = (types) => () => (next) => (action) => {
  const matchedType = types[action.type]
  if (matchedType && Array.isArray(matchedType)) {
    matchedType.forEach(({ key, value, payload, initialValue }) => {
      if (!key) return

      let newValue

      if (value) {
        newValue = value
      } else if (payload && action.payload[payload] !== undefined) {
        newValue = action.payload[payload]
      } else {
        newValue = action.payload
      }

      // if newValue is undefined, do not save it
      if (newValue === undefined) return

      // check that the value type matches the initial type
      if (
        !initialValue ||
        (typeof initialValue === typeof newValue &&
          Array.isArray(initialValue) === Array.isArray(newValue))
      ) {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    })
  }

  return next(action)
}

export default localStorageMiddleware
