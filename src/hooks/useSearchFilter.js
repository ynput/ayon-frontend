import { useEffect, useMemo, useRef, useState } from 'react'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

export const filterByFieldsAndValues = ({
  filters = [],
  data = [],
  fields = [],
  matchesAll = false,
}) => {
  // create keywords that are used for searching
  const dataWithKeywords = data.map((item) => ({
    ...item,
    keywords: Object.entries(item).flatMap(([k, v]) => {
      if (fields.includes(k)) {
        if (typeof v === 'string') {
          return v?.toLowerCase()
        } else if (Array.isArray(v)) {
          return v?.flatMap((v) => v?.toLowerCase())
        } else if (typeof v === 'boolean' && v) {
          return k?.toLowerCase()
        } else return []
      } else if (v && typeof v === 'object') {
        return Object.entries(v).flatMap(([k2, v2]) => {
          return fields.includes(`${k}.${k2}`) && v2 ? v2.toString()?.toLowerCase() : []
        })
      } else return []
    }),
  }))

  if (filters?.length && dataWithKeywords) {
    return dataWithKeywords.filter((item) => {
      const matchingKeys = []
      const inverseMatchingKeys = []
      item.keywords?.forEach((key) => {
        filters.forEach((filter) => {
          let lowerFilter = filter?.toLowerCase()
          // if lowerFilter has a ! at the start do opposite
          if (lowerFilter[0] === '!') {
            lowerFilter = lowerFilter.slice(1)
            // if key includes the lowerFilter without the ! it's not a match
            if (
              key.includes(lowerFilter) &&
              !inverseMatchingKeys.includes(lowerFilter) &&
              lowerFilter.length > 2
            ) {
              inverseMatchingKeys.push(lowerFilter)
            } else if (!matchingKeys.includes(lowerFilter)) {
              matchingKeys.push(lowerFilter)
            }
          } else {
            if (key.includes(lowerFilter) && !matchingKeys.includes(lowerFilter))
              matchingKeys.push(lowerFilter)
          }
        })
      })

      // if there are any inverse matches return false
      if (inverseMatchingKeys.length) return false

      if (matchesAll) return matchingKeys.length >= filters.length
      else return matchingKeys.length > 0
    })
  } else return data
}

const SEARCH_DEBOUNCE_MS = 200

const parseSearch = (search) =>
  // separate search into array by ,
  // end up with array ['search', 'search2']
  search.split(',').reduce((acc, cur) => {
    const value = cur.trim().toLowerCase()
    if (value) acc.push(value)
    return acc
  }, [])

// Returns [inputValue, setInputValue, filteredData].
// The input value updates right away; filtering (and the url, when `id` is set) follows once typing
// pauses, so large lists are filtered once per pause instead of once per key.
const useSearchFilter = (fields = [], data = [], id) => {
  let key = 'search'
  id && (key += '-' + id)
  const [urlSearch, setUrlSearch] = useQueryParam(key, withDefault(StringParam, ''))
  // The input must not be driven by the url: the router commits location changes in a transition,
  // so on a slow page React resets the input to the old value and typed characters get lost.
  const [searchString, setSearchString] = useState(id ? urlSearch : '')
  const [appliedSearch, setAppliedSearch] = useState(searchString)
  // the value we last wrote to the url, until the url catches up with it
  const pendingUrlSearch = useRef(null)

  useEffect(() => {
    if (searchString === appliedSearch) return
    const timeout = setTimeout(() => {
      setAppliedSearch(searchString)
      if (id) {
        pendingUrlSearch.current = searchString
        setUrlSearch(searchString)
      }
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchString, appliedSearch, id, setUrlSearch])

  // follow url changes made elsewhere (e.g. a link to the same page), ignoring our own writes
  useEffect(() => {
    if (!id) return
    if (pendingUrlSearch.current !== null) {
      if (urlSearch === pendingUrlSearch.current) pendingUrlSearch.current = null
      return
    }
    setSearchString(urlSearch)
    setAppliedSearch(urlSearch)
  }, [urlSearch, id])

  if (!fields.length) {
    fields = data
  }

  const filteredData = useMemo(() => {
    if (!appliedSearch.length) return data
    return filterByFieldsAndValues({
      filters: parseSearch(appliedSearch),
      data,
      fields,
      matchesAll: true,
    })
  }, [appliedSearch, data])

  return [searchString, setSearchString, filteredData]
}

export default useSearchFilter
