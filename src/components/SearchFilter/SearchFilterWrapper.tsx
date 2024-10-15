import useBuildFilterOptions, { BuildFilterOptions } from '@hooks/useBuildFilterOptions'
import { FC, useState } from 'react'
import SearchFilter, { SearchFilterProps } from './SearchFilter'
import { Filter } from './types'

interface SearchFilterWrapperProps extends BuildFilterOptions {
  filters: SearchFilterProps['filters']
  onChange: SearchFilterProps['onChange']
}

const SearchFilterWrapper: FC<SearchFilterWrapperProps> = ({
  filters: _filters,
  onChange,
  filterTypes,
  projectNames,
  scope,
  attributesData,
  tagsData,
}) => {
  const options = useBuildFilterOptions({
    filterTypes,
    projectNames,
    scope,
    attributesData,
    tagsData,
  })

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>(_filters)

  return (
    <SearchFilter
      options={options}
      filters={filters}
      onChange={setFilters}
      onFinish={(v) => onChange(v)} // when changes are applied
    />
  )
}

export default SearchFilterWrapper
