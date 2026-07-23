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
import { useProjectFoldersContext } from '@shared/context'

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
  const { getFolderById } = useProjectFoldersContext()

  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope,
    data,
  })

  // Convert QueryFilter to Filter[] for the SearchFilter component
  const filters = useMemo(() => {
    const filters = queryFilterToClientFilter(queryFilters, options)
    const pinned: Filter | null =
      pinnedSlice && Object.keys(pinnedSlice.rowSelection).length > 0
        ? {
            id: pinnedSlice.sliceType + '__pinned',
            label: pinnedSlice.sliceType,
            type: 'string',
            inverted: false,
            operator: 'OR',
            values: Object.keys(pinnedSlice.rowSelection)
              .filter((id) => pinnedSlice.rowSelection[id])
              .map((id) => {
                const folder = getFolderById(id)
                return { id, label: folder?.label || folder?.name || id }
              }),
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
      enableAutosuggestion={true}
    />
  )
}

export default SearchFilterWrapper
