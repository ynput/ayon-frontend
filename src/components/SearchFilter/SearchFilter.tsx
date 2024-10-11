import { FC, useState } from 'react'
import { Filter, filterOptions, initFilter, Option } from './types'
import * as Styled from './SearchFilter.styled'
import { Icon } from '@ynput/ayon-react-components'
import { SearchFilterItem } from './SearchFilterItem'
import SearchFilterDropdown from './SearchFilterDropdown'

interface SearchFilterProps {}

const SearchFilter: FC<SearchFilterProps> = ({}) => {
  const [filtersData, setFiltersData] = useState<Filter[]>(initFilter)

  const [options, setOptions] = useState<Option[] | null>(null)

  const handleClose = () => {
    // remove any filters that have no values
    const updatedFilters = filtersData.filter((filter) => filter.values && filter.values.length > 0)
    setFiltersData(updatedFilters)

    // set options to null
    setOptions(null)
  }

  const handleOptionSelect = (option: Option) => {
    const { values, parentId } = option

    // check if there is a parent id
    if (parentId) {
      // find the parent filter
      const parentFilter = filtersData.find((filter) => filter.id === parentId)

      // add to the parent filter values
      if (parentFilter) {
        const updatedValues = parentFilter.values?.some((val) => val.id === option.id)
          ? parentFilter.values.filter((val) => val.id !== option.id)
          : [...(parentFilter.values || []), option]

        const updatedParentFilter = {
          ...parentFilter,
          values: updatedValues,
        }

        setFiltersData(
          filtersData.map((filter) => (filter.id === parentId ? updatedParentFilter : filter)),
        )
      }
    } else {
      const addFilter = { ...option, values: [] }
      // add to filters top level
      setFiltersData([...filtersData, addFilter])
    }

    // if there are values set the next options
    if (values && values.length > 0) {
      const newOptions = values.map((value) => ({ ...value, parentId: option.id }))

      setOptions(newOptions)
    }
  }

  const handleOpenFilter = (filter: Filter) => {
    // find the filter option and set those values
    const filterOption = filterOptions.find((option) => option.id === filter.id)
    if (filterOption && filterOption.values && filterOption.values.length > 0) {
      const newOptions = filterOption.values.map((value) => ({ ...value, parentId: filter.id }))
      setOptions(newOptions)
    } else {
      setOptions(filterOptions)
    }
  }

  return (
    <Styled.Container>
      {options && <Styled.Backdrop onClick={handleClose} />}
      <Styled.SearchBar>
        <Icon icon="search" />
        <Styled.SearchBarFilters>
          {filtersData.map((filter, index) => (
            <SearchFilterItem
              key={filter.id + index}
              {...filter}
              showOperator={index > 0}
              onClick={() => handleOpenFilter(filter)}
            />
          ))}
        </Styled.SearchBarFilters>
        <Styled.AddButton icon={'add'} variant="text" onClick={() => setOptions(filterOptions)} />
      </Styled.SearchBar>
      {options && (
        <SearchFilterDropdown
          options={options}
          values={filtersData}
          onCancel={handleClose}
          onSelect={handleOptionSelect}
        />
      )}
    </Styled.Container>
  )
}

export default SearchFilter
