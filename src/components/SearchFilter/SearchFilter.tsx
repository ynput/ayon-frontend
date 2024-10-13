import { FC, useState } from 'react'
import { Filter, filterOptions, initFilter, Option } from './types'
import * as Styled from './SearchFilter.styled'
import { Icon } from '@ynput/ayon-react-components'
import { SearchFilterItem } from './SearchFilterItem'
import SearchFilterDropdown from './SearchFilterDropdown'
import { uuid } from 'short-uuid'

interface SearchFilterProps {}

const SearchFilter: FC<SearchFilterProps> = ({}) => {
  const [filtersData, setFiltersData] = useState<Filter[]>(initFilter)

  const [options, setOptions] = useState<Option[] | null>(null)

  const handleOpenOptions = () => {
    setOptions(filterOptions)
  }

  const handleClose = () => {
    // remove any filters that have no values
    const updatedFilters = filtersData.filter((filter) => filter.values && filter.values.length > 0)
    setFiltersData(updatedFilters)

    // set options to null
    setOptions(null)
  }

  const handleOptionSelect = (option: Option) => {
    const { values, parentId } = option

    // create new id for the filter so we can add multiple of the same filter name
    const newId = `${option.id}-${uuid()}`
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
      const addFilter = { ...option, id: newId, values: [] }
      // add to filters top level
      setFiltersData([...filtersData, addFilter])
    }

    // if there are values set the next options
    if (values && values.length > 0) {
      const newOptions = values.map((value) => ({ ...value, parentId: newId }))

      setOptions(newOptions)
    }
  }

  const handleEditFilter = (id: string) => {
    const filterName = id.split('-')[0]
    // find the filter option and set those values
    const filterOption = filterOptions.find((option) => option.id === filterName)
    if (filterOption && filterOption.values && filterOption.values.length > 0) {
      console.log(id)
      const newOptions = filterOption.values.map((value) => ({ ...value, parentId: id }))
      setOptions(newOptions)
    } else {
      setOptions(filterOptions)
    }
  }

  const handleRemoveFilter = (id: string) => {
    // remove a filter by id
    const updatedFilters = filtersData.filter((filter) => filter.id !== id)
    setFiltersData(updatedFilters)
  }

  return (
    <Styled.Container>
      {options && <Styled.Backdrop onClick={handleClose} />}
      <Styled.SearchBar>
        <Icon icon="search" className="search" onClick={handleOpenOptions} />
        <Styled.SearchBarFilters>
          {filtersData.map((filter, index) => (
            <SearchFilterItem
              key={filter.id + index}
              {...filter}
              showOperator={index > 0}
              onClick={() => handleEditFilter(filter.id)}
              onRemove={handleRemoveFilter}
            />
          ))}
        </Styled.SearchBarFilters>
        <Styled.FilterButton icon={'add'} variant="text" onClick={handleOpenOptions} />
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
