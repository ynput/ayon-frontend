import { useMemo } from 'react'
import { Filter, SEARCH_FILTER_ID } from '@ynput/ayon-react-components'
import { type QueryTasksFoldersApiArg } from '@shared/api'
import { clientFilterToQueryFilter } from '../utils'
import { QueryFilter, QueryCondition } from '../types/operations'

interface UseQueryFiltersProps {
  queryFilters: QueryFilter
  sliceFilter?: Filter | null
  config?: {
    searchKey?: string
  }
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
  config: { searchKey } = {},
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

    //  extract text search and name filter conditions, remove them from combinedQueryFilter and merge to fuzzySearchFilter
    let fuzzySearchFilter = ''

    if (combinedQueryFilter?.conditions?.length) {
      const searchValues: string[] = []

      const remainingConditions = combinedQueryFilter.conditions.filter((condition) => {
        const queryCondition = condition as QueryCondition

        // Extract global text search filter
        if (queryCondition.key === SEARCH_FILTER_ID) {
          const val = queryCondition.value
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            searchValues.push(String(val))
          }
          return false // remove search condition
        }

        // Extract name filter (can be scoped like 'task_name' or 'folder_name' or just 'name')
        if (
          (searchKey && queryCondition.key === searchKey) ||
          queryCondition.key?.endsWith('_' + 'searchKey')
        ) {
          const val = queryCondition.value
          // Name filters use 'like' operator with wildcards, extract the actual search term
          if (val !== undefined && val !== null) {
            if (Array.isArray(val)) {
              val.forEach((v) => {
                const searchTerm = String(v).replace(/%/g, '').trim()
                if (searchTerm) {
                  searchValues.push(searchTerm)
                }
              })
            } else {
              const searchTerm = String(val).replace(/%/g, '').trim()
              if (searchTerm) {
                searchValues.push(searchTerm)
              }
            }
          }
          return false // remove name condition
        }

        return true
      })

      // Join multiple search conditions into one space-separated fuzzy search string
      fuzzySearchFilter = searchValues.join(' ')

      // If there are remaining conditions, keep them; otherwise set empty conditions
      combinedQueryFilter = remainingConditions.length
        ? { ...combinedQueryFilter, conditions: remainingConditions }
        : { ...combinedQueryFilter, conditions: [] }
    }

    const queryFilterString = combinedQueryFilter?.conditions?.length
      ? JSON.stringify(combinedQueryFilter)
      : ''

    return {
      filterString: queryFilterString,
      filter: combinedQueryFilter,
      search: fuzzySearchFilter,
      combinedFilters: combinedQueryFilter,
      displayFilters: displayQueryFilter,
    }
  }, [queryFilters, sliceFilter])
}
