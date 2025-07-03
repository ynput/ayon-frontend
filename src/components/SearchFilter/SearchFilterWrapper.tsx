import { BuildFilterOptions, useBuildFilterOptions } from '@shared/components'
import { FC, useEffect, useState } from 'react'
import { ALLOW_GLOBAL_SEARCH, ALLOW_MULTIPLE_SAME_FILTERS } from './featureFlags'
import { SearchFilter, SearchFilterProps, Filter } from '@ynput/ayon-react-components'

interface SearchFilterWrapperProps extends BuildFilterOptions {
  filters: SearchFilterProps['filters']
  onChange: SearchFilterProps['onChange']
  disabledFilters?: string[]
}

const SearchFilterWrapper: FC<SearchFilterWrapperProps> = ({
  filters: _filters,
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

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>(_filters)

  // update filters when it changes
  useEffect(() => {
    setFilters(_filters)
  }, [_filters, setFilters])

  return (
    <SearchFilter
      options={options}
      filters={filters}
      onChange={setFilters}
      onFinish={(v) => onChange(v)} // when changes are applied
      enableMultipleSameFilters={ALLOW_MULTIPLE_SAME_FILTERS}
      enableGlobalSearch={ALLOW_GLOBAL_SEARCH}
      disabledFilters={disabledFilters}
    />
  )
}

export default SearchFilterWrapper
