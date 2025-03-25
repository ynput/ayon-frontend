import { useMemo, useState } from 'react'
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

const useSearchFilter = (fields = [], data = [], id) => {
  let key = 'search'
  id && (key += '-' + id)
  const [search, setSearch] = useQueryParam(key, withDefault(StringParam, ''))
  const [searchLocal, setSearchLocal] = useState('')
  const searchString = id ? search : searchLocal

  if (!fields.length) {
    fields = data
  }

  // separate searchString into array by ,
  // end up with array ['search', 'search2']
  const searchArray = searchString?.split(',').reduce((acc, cur) => {
    if (!cur) return acc
    if (cur.trim() === '') return acc
    else {
      acc.push(cur.trim()?.toLowerCase())
      return acc
    }
  }, [])

  let filteredData = useMemo(
    () =>
      searchString.length
        ? filterByFieldsAndValues({ filters: searchArray, data, fields, matchesAll: true })
        : data,
    [searchString, data],
  )

  const onSearchChange = (v) => (id ? setSearch(v) : setSearchLocal(v))

  return [searchString, onSearchChange, filteredData]
}

export default useSearchFilter
