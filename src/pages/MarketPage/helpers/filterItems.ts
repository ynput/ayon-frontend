type FilterFunction = (value: any, item: any) => boolean

export interface FilterCriteria {
  [key: string]: any | FilterFunction
}

export const filterItems = (items: any[], filter: FilterCriteria[]): any[] => {
  return items.filter((item) => {
    return filter.every((f) => {
      return Object.keys(f).every((key) => {
        return typeof f[key] === 'function'
          ? (f[key] as FilterFunction)(item[key], item)
          : item[key] == f[key]
      })
    })
  })
}
