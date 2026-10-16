// The compared list is loaded in one query, so compare is only supported up to this many items
export const MAX_COMPARE_ITEMS = 5000

export const COMPARE_TOO_MANY_ITEMS = `Compare is not supported for lists with more than ${MAX_COMPARE_ITEMS} items`

export const isTooBigToCompare = (list?: { count?: number | null }) =>
  (list?.count ?? 0) > MAX_COMPARE_ITEMS
