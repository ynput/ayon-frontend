import { FC, useRef, useState } from 'react'
import { Filter, filterOptions, initFilter, Option } from './types'
import * as Styled from './SearchFilter.styled'
import { Icon } from '@ynput/ayon-react-components'
import { SearchFilterItem } from './SearchFilterItem'
import SearchFilterDropdown from './SearchFilterDropdown'
import { uuid } from 'short-uuid'
import clsx from 'clsx'
import { useFocusFirstOption } from './hooks'

interface SearchFilterProps {}

const SearchFilter: FC<SearchFilterProps> = ({}) => {
  const filtersRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

  const [filtersData, setFiltersData] = useState<Filter[]>(initFilter)

  const [options, setOptions] = useState<Option[] | null>(null)

  useFocusFirstOption({ ref: dropdownRef, options })

  const handleOpenOptions = () => {
    setOptions(filterOptions)
  }

  const handleClose = () => {
    // remove any filters that have no values
    const updatedFilters = filtersData.filter((filter) => filter.values && filter.values.length > 0)
    setFiltersData(updatedFilters)

    // set options to null
    setOptions(null)

    // get parent id from options
    const id = options?.[0].parentId
    if (id) {
      // find filter element by the id and focus it
      document.getElementById(id)?.focus()
    } else {
      // focus last filter
      const filters = filtersRef.current?.querySelectorAll('.search-filter-item')
      const lastFilter = filters?.[filters.length - 1] as HTMLElement
      lastFilter?.focus()
    }
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

  const handleContainerKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    // cancel on esc
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      handleClose()
    }
  }

  const handleSearchBarKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    // open on enter or space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      handleOpenOptions()
    }
    // focus next item on arrow right / left
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      event.stopPropagation()
      const target = event.target as HTMLElement
      let next = target.nextElementSibling as HTMLElement | null
      while (next && !next.classList.contains('search-filter-item')) {
        next = next.nextElementSibling as HTMLElement | null
        if (next === null) break // Safeguard to prevent infinite loop
      }

      let prev = target.previousElementSibling as HTMLElement | null
      while (prev && !prev.classList.contains('search-filter-item')) {
        prev = prev.previousElementSibling as HTMLElement | null
        if (prev === null) break // Safeguard to prevent infinite loop
      }
      if (event.key === 'ArrowRight') {
        next?.focus()
      } else {
        prev?.focus()
      }
    }
  }

  return (
    <Styled.Container onKeyDown={handleContainerKeyDown}>
      {options && <Styled.Backdrop onClick={handleClose} />}
      <Styled.SearchBar
        className={clsx({ empty: !filtersData.length })}
        onClick={() => !filtersData.length && handleOpenOptions()}
        onKeyDown={handleSearchBarKeyDown}
        tabIndex={0}
      >
        <Icon icon="search" className="search" onClick={handleOpenOptions} />
        <Styled.SearchBarFilters ref={filtersRef}>
          {filtersData.map((filter, index) => (
            <SearchFilterItem
              key={filter.id + index}
              {...filter}
              showOperator={index > 0}
              onEdit={handleEditFilter}
              onRemove={handleRemoveFilter}
            />
          ))}
        </Styled.SearchBarFilters>
        {filtersData.length ? (
          <Styled.FilterButton icon={'add'} variant="text" onClick={handleOpenOptions} />
        ) : (
          <span>Search and filter</span>
        )}
      </Styled.SearchBar>
      {options && (
        <SearchFilterDropdown
          options={options}
          values={filtersData}
          onSelect={handleOptionSelect}
          ref={dropdownRef}
        />
      )}
    </Styled.Container>
  )
}

export default SearchFilter
