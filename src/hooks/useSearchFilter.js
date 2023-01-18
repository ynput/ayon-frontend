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
        user.keywords?.some((key) =>
          searchArray.forEach((split) => {
            if (key.includes(split) && !matchingKeys.includes(split)) matchingKeys.push(split)
          }),
        )

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
