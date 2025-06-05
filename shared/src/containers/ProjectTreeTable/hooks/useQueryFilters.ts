import { useMemo } from 'react'
import { Filter } from '@ynput/ayon-react-components'
import { type QueryTasksFoldersApiArg } from '@shared/api'
import { clientFilterToQueryFilter } from '../utils'

interface UseQueryFiltersProps {
  filters: Filter[]
  sliceFilter?: Filter | null
}

interface QueryFiltersResult {
  filter: QueryTasksFoldersApiArg['tasksFoldersQuery']['filter']
  filterString?: string
  search: QueryTasksFoldersApiArg['tasksFoldersQuery']['search']
  combinedFilters: Filter[]
}

export const useQueryFilters = ({
  filters,
  sliceFilter,
}: UseQueryFiltersProps): QueryFiltersResult => {
  return useMemo(() => {
    // merge the slice filter with the user filters
    let combinedFilters = [...filters]
    if (sliceFilter?.values?.length) {
      combinedFilters.push(sliceFilter as Filter)
    }

    // transform the task bar filters to the query format
    const queryFilter = clientFilterToQueryFilter(combinedFilters)
    const queryFilterString = combinedFilters.length ? JSON.stringify(queryFilter) : ''
    // extract the fuzzy search from the filters
    const fuzzySearchFilter = combinedFilters.find((filter) => filter.id.includes('text'))
      ?.values?.[0]?.id

    return {
      filterString: queryFilterString,
      filter: queryFilter,
      search: fuzzySearchFilter,
      combinedFilters,
    }
  }, [filters, sliceFilter])
}
