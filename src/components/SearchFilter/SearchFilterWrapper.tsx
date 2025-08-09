import { BuildFilterOptions, useBuildFilterOptions } from '@shared/components'
import { FC, useState, useEffect } from 'react'
import { ALLOW_GLOBAL_SEARCH, ALLOW_MULTIPLE_SAME_FILTERS } from './featureFlags'
import { SearchFilter, Filter } from '@ynput/ayon-react-components'
import {
  QueryFilter,
  clientFilterToQueryFilter,
  queryFilterToClientFilter,
} from '@shared/containers/ProjectTreeTable'

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
  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope,
    data,
  })

  // Convert QueryFilter to Filter[] for the SearchFilter component
  const filters = queryFilterToClientFilter(queryFilters, options)

  // Use filters directly as initial state and manage changes through onChange
  const [localFilters, setLocalFilters] = useState<Filter[]>(filters)

  // Update localFilters when filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [JSON.stringify(filters)])

  // Convert Filter[] back to QueryFilter when changes are applied
  const handleFinish = (newFilters: Filter[]) => {
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
