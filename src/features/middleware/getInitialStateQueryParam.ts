import { isArray } from 'lodash'

const getInitialStateQueryParam = (key: string, initial: any, types: any[] = []): any => {
  const urlParams = new URLSearchParams(window.location.search)

  const isValueArray = isArray(initial) || types.some((type) => isArray(type))
  let value: any = isValueArray ? urlParams.getAll(key) : urlParams.get(key)

  if (!value || value === 'null' || value === 'undefined') {
    return initial !== undefined ? initial : (types && types[0]) || ''
  } else {
    try {
      if (initial) {
        if (typeof initial !== typeof value) {
          value = initial
        } else if (Array.isArray(initial) && !Array.isArray(value)) {
          value = initial
        } else if (!Array.isArray(initial) && Array.isArray(value)) {
          value = initial
        }
      }

      if (!types?.find((type) => type === value) && types?.length) {
        value = types[0]
      }

      return value
    } catch (error) {
      // remove from query params
      urlParams.delete(key)
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)

      return initial || (types && types[0]) || null
    }
  }
}

export default getInitialStateQueryParam
