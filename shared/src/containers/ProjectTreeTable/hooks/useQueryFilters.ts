import { useMemo } from 'react'
import { Filter } from '@ynput/ayon-react-components'
import { type QueryTasksFoldersApiArg } from '@shared/api'
import { clientFilterToQueryFilter } from '../utils'
import { QueryFilter, QueryCondition } from '../types/operations'

interface UseQueryFiltersProps {
  queryFilters: QueryFilter
  sliceFilter?: Filter | null
}

interface QueryFiltersResult {
  filter: QueryTasksFoldersApiArg['tasksFoldersQuery']['filter']
  filterString?: string
  search: QueryTasksFoldersApiArg['tasksFoldersQuery']['search']
  combinedFilters: QueryFilter // For data fetching (includes slice filters)
  displayFilters: QueryFilter // For SearchFilterWrapper (excludes slice filters, except hierarchy)
}

export const useQueryFilters = ({
  queryFilters,
  sliceFilter,
}: UseQueryFiltersProps): QueryFiltersResult => {
  return useMemo(() => {
    let combinedQueryFilter = queryFilters

    // If there's a slice filter, convert it and merge it with the query filters
    if (sliceFilter?.values?.length) {
      const sliceQueryFilter = clientFilterToQueryFilter([sliceFilter])

      // Merge the slice filter with existing query filters for data fetching
      if (sliceQueryFilter.conditions?.length) {
        const existingConditions = combinedQueryFilter?.conditions || []
        combinedQueryFilter = {
          conditions: [...existingConditions, ...sliceQueryFilter.conditions],
          operator: 'and',
        }
      }
    }

    // Create display filters (for SearchFilterWrapper)
    // This excludes slice filters, except for hierarchy when slice type changes
    let displayQueryFilter = queryFilters

    const queryFilterString = combinedQueryFilter?.conditions?.length
      ? JSON.stringify(combinedQueryFilter)
      : ''

    // For text search, we'll need to extract it from the slice filter if it contains text
    const fuzzySearchFilter = sliceFilter?.id?.includes('text')
      ? sliceFilter?.values?.[0]?.id
      : undefined

    return {
      filterString: queryFilterString,
      filter: combinedQueryFilter,
      search: fuzzySearchFilter,
      combinedFilters: combinedQueryFilter,
      displayFilters: displayQueryFilter,
    }
  }, [queryFilters, sliceFilter])
}
