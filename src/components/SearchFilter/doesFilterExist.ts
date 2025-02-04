import getFilterFromId from './getFilterFromId'
import { Filter } from './types'

const doesFilterExist = (filterId: string, filters: Filter[]) => {
  const filterName = getFilterFromId(filterId)
  return filters.some((filter) => getFilterFromId(filter.id) === filterName)
}

export default doesFilterExist
