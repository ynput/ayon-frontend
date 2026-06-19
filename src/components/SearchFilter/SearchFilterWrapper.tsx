import { BuildFilterOptions, useBuildFilterOptions } from '@shared/components'
import { FC, useState, useEffect, useMemo } from 'react'
import { ALLOW_GLOBAL_SEARCH, ALLOW_MULTIPLE_SAME_FILTERS } from './featureFlags'
import { SearchFilter, Filter } from '@ynput/ayon-react-components'
import {
  QueryFilter,
  clientFilterToQueryFilter,
  queryFilterToClientFilter,
} from '@shared/containers/ProjectTreeTable'
import { useSlicerContext } from '@shared/containers'

interface SearchFilterWrapperProps extends BuildFilterOptions {
  queryFilters: QueryFilter
  onChange: (queryFilter: QueryFilter) => void
  disabledFilters?: string[]
}

const SearchFilterWrapper: FC<SearchFilterWrapperProps> = ({
  queryFilters,
  onChange,
  filterTypes,
  projectNames,
  scope,
  data,
  disabledFilters,
}) => {
  const { pinnedSlice, setPinnedSlice } = useSlicerContext()

  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope,
    data,
  })

  // Convert QueryFilter to Filter[] for the SearchFilter component
  const filters = useMemo(() => {
    const filters = queryFilterToClientFilter(queryFilters, options)
    const pinned: Filter | null = pinnedSlice
      ? {
          id: pinnedSlice.sliceType + '__pinned',
          label: pinnedSlice.sliceType,
          type: 'string',
          inverted: false,
          operator: 'OR',
          values: Object.values(pinnedSlice.rowSelectionData).map((item) => ({
            id: item.id,
            label: item.label || item.name || '',
          })),
        }
      : null

    return pinned ? [pinned, ...filters] : filters
  }, [queryFilters, options, pinnedSlice])

  // Use filters directly as initial state and manage changes through onChange
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)

  // Update localFilters when filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)])

  // Convert Filter[] back to QueryFilter when changes are applied
  const handleFinish = (newFilters: Filter[]) => {
    // Check if pinned slice was removed
    const pinnedId = pinnedSlice ? pinnedSlice.sliceType + '__pinned' : null
    const isPinnedRemoved = !!pinnedId && !newFilters.some((f) => f.id === pinnedId)

    if (isPinnedRemoved) {
      setPinnedSlice(null)

      // Check if it's the only change
      const otherFilters = newFilters.filter((f) => f.id !== pinnedId)
      const originalOtherFilters = localFilters.filter((f) => f.id !== pinnedId)

      if (JSON.stringify(otherFilters) === JSON.stringify(originalOtherFilters)) {
        return
      }
    }

    const queryFilter = clientFilterToQueryFilter(newFilters)
    onChange(queryFilter)
  }

  return (
    <SearchFilter
      options={options}
      filters={localFilters}
      onChange={setLocalFilters}
      onFinish={handleFinish}
      enableMultipleSameFilters={ALLOW_MULTIPLE_SAME_FILTERS}
      enableGlobalSearch={ALLOW_GLOBAL_SEARCH}
      disabledFilters={disabledFilters}
    />
  )
}

export default SearchFilterWrapper
