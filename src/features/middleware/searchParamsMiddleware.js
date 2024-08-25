// This middleware is used to save the state to the local storage
// It intercepts the action and saves the state to the local storage
// if the action type matches the type specified in the types object

import { isEmpty } from 'lodash'

const searchParamsMiddleware = (types) => () => (next) => (action) => {
  const matchedType = types[action.type]

  if (matchedType && Array.isArray(matchedType)) {
    const urlParams = new URLSearchParams(window.location.search)
    matchedType.forEach(({ state, key, value }) => {
      if (!state || !key) return

      let newValue

      if (value !== undefined) {
        newValue = value
      } else if (action.payload && action.payload[state] !== undefined) {
        newValue = action.payload[state]
      } else return

      // remove last value from query params
      urlParams.delete(key)
      // if value is null or undefined or is empty, do nothing else
      if (newValue === null || newValue === undefined || isEmpty(newValue)) return
      // if value is an array, add each value to the query params
      if (Array.isArray(newValue)) {
        newValue.forEach((val) => urlParams.append(key, val))
      } else {
        urlParams.set(key, newValue)
      }
    })

    const paramsString = urlParams.toString()
    const newUrl = paramsString
      ? `${window.location.pathname}?${paramsString}`
      : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }

  return next(action)
}

// Keeping URL 'ayon-entity' query param in sync with the store context URI
const updateUrlOnUriChange = () => () => (next) => (action) => {
  const key = 'ayon-entity'
  const matchedType = 'context/setUri'
  const uri = action.payload

  if (action.type !== matchedType) {
    return next(action)
  }

  const urlParams = new URLSearchParams(window.location.search)
  urlParams.delete(key)
  if (uri != null) {
    urlParams.set(key, encodeURIComponent(uri))
  }

  const paramsString = urlParams.toString()
  const newUrl = paramsString
    ? `${window.location.pathname}?${paramsString}`
    : window.location.pathname
  window.history.replaceState({}, '', newUrl)

  return next(action)
}

export { updateUrlOnUriChange }
export default searchParamsMiddleware
