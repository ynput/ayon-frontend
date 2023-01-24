import { useMemo, useState } from 'react'

const useSearchFilter = (fields, data) => {
  const [search, setSearch] = useState('')

  // create keywords that are used for searching
  const dataWithKeywords = useMemo(
    () =>
      data.map((user) => ({
        ...user,
        keywords: Object.entries(user).flatMap(([k, v]) => {
          if (fields.includes(k)) {
            if (typeof v === 'string') {
              return v.toLowerCase()
            } else if (Array.isArray(v)) {
              return v.flatMap((v) => v)
            } else if (typeof v === 'boolean' && v) {
              return k.toLowerCase()
            } else return []
          } else if (typeof v === 'object') {
            return Object.entries(v).flatMap(([k2, v2]) =>
              fields.includes(`${k}.${k2}`) && v2 ? v2.toLowerCase() : [],
            )
          } else return []
        }),
      })),
    [data],
  )

  let filtedData = useMemo(() => {
    // separate into array by ,
    const searchArray = search.split(',').reduce((acc, cur) => {
      if (cur.trim() === '') return acc
      else {
        acc.push(cur.trim())
        return acc
      }
    }, [])

    if (searchArray.length && dataWithKeywords) {
      return dataWithKeywords.filter((user) => {
        const matchingKeys = []
        const inverseMatchingKeys = []
        user.keywords?.forEach((key) => {
          searchArray.forEach((split) => {
            // if split has a ! at the start do opposite
            if (split[0] === '!') {
              split = split.slice(1)
              // if key includes the split without the ! it's not a match
              if (key.includes(split) && !inverseMatchingKeys.includes(split) && split.length > 2) {
                inverseMatchingKeys.push(split)
              } else if (!matchingKeys.includes(split)) {
                matchingKeys.push(split)
              }
            } else {
              if (key.includes(split) && !matchingKeys.includes(split)) matchingKeys.push(split)
            }
          })
        })

        // if there are any inverse matches return false
        if (inverseMatchingKeys.length) return false

        return matchingKeys.length >= searchArray.length
      })
    } else return null
  }, [dataWithKeywords, search])

  if (!filtedData) {
    filtedData = data
  }

  return [search, setSearch, filtedData]
}

export default useSearchFilter
