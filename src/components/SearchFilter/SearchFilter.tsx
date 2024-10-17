import { FC, useRef, useState } from 'react'
import { Filter, Option } from './types'
import * as Styled from './SearchFilter.styled'
import { Icon } from '@ynput/ayon-react-components'
import { SearchFilterItem } from './SearchFilterItem'
import SearchFilterDropdown, {
  getIsValueSelected,
  SearchFilterDropdownProps,
} from './SearchFilterDropdown/SearchFilterDropdown'
import clsx from 'clsx'
import { useFocusOptions } from './hooks'
import buildFilterId from './buildFilterId'
import getFilterFromId from './getFilterFromId'

const sortSelectedToTopFields = ['assignee', 'taskType']

export interface SearchFilterProps {
  filters: Filter[]
  onChange: (filters: Filter[]) => void
  onFinish?: (filters: Filter[]) => void
  options: Option[]
  disableSearch?: boolean
}

const SearchFilter: FC<SearchFilterProps> = ({
  filters = [],
  onChange,
  onFinish,
  options: initOptions = [],
  disableSearch = false,
}) => {
  const filtersRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

  const options = getOptionsWithSearch(initOptions, disableSearch)

  const [dropdownParentId, setDropdownParentId] = useState<null | string>(null)
  const [dropdownOptions, setOptions] = useState<Option[] | null>(null)

  useFocusOptions({ ref: dropdownRef, options: dropdownOptions })

  const openOptions = (options: Option[], parentId: string | null) => {
    setOptions(options)
    setDropdownParentId(parentId)
  }

  const openInitialOptions = () => openOptions(options, null)

  const closeOptions = () => {
    setOptions(null)
    setDropdownParentId(null)
  }

  const handleClose = (filters: Filter[]) => {
    // remove any filters that have no values
    const updatedFilters = filters.filter((filter) => filter.values && filter.values.length > 0)
    onChange(updatedFilters)

    // set dropdownOptions to null
    closeOptions()
    // call onClose if it exists
    onFinish && onFinish(updatedFilters)

    if (dropdownParentId) {
      // find filter element by the id and focus it
      document.getElementById(dropdownParentId)?.focus()
    } else {
      // focus last filter
      const filters = filtersRef.current?.querySelectorAll('.search-filter-item')
      const lastFilter = filters?.[filters.length - 1] as HTMLElement
      lastFilter?.focus()
    }
  }

  const handleOptionSelect: SearchFilterDropdownProps['onSelect'] = (option, config) => {
    const { values, parentId } = option

    // create new id for the filter so we can add multiple of the same filter name
    const newId = buildFilterId(option.id)
    // check if there is a parent id
    if (parentId) {
      // find the parent filter
      const parentFilter = filters.find((filter) => filter.id === parentId)

      // add to the parent filter values
      if (parentFilter) {
        const updatedValues = parentFilter.values?.some((val) => val.id === option.id)
          ? parentFilter.values.filter((val) => val.id !== option.id)
          : [...(parentFilter.values || []), option]

        const updatedParentFilter = {
          ...parentFilter,
          values: updatedValues,
        }

        const updatedFilters = filters.map((filter) =>
          filter.id === parentId ? updatedParentFilter : filter,
        )

        onChange(updatedFilters)

        // close the dropdown with the new filters
        if (config?.confirm) handleClose(updatedFilters)
      }
    } else {
      const addFilter = { ...option, id: newId, values: [] }
      // remove not required fields
      delete addFilter.allowsCustomValues
      // add to filters top level
      onChange([...filters, addFilter])
    }

    // if there are values set the next dropdownOptions
    // or the option allows custom values (text)
    if ((values && values.length > 0 && !parentId) || option.allowsCustomValues) {
      const newOptions = values?.map((value) => ({ ...value, parentId: newId })) || []

      openOptions(newOptions, newId)
    }
  }

  const handleEditFilter = (id: string) => {
    // find the filter option and set those values
    const filter = filters.find((filter) => filter.id === id)
    if (filter && filter.values && filter.values.length > 0) {
      // Merge options with filter values to include custom values
      const newOptions = mergeOptionsWithFilterValues(filter, options).map((value) => ({
        ...value,
        parentId: id,
        isSelected: getIsValueSelected(value.id, id, filters),
      }))

      const filterName = getFilterFromId(id)
      if (sortSelectedToTopFields.includes(filterName)) {
        // sort selected to top
        newOptions.sort((a, b) => {
          if (a.isSelected && !b.isSelected) return -1
          if (!a.isSelected && b.isSelected) return 1
          return 0
        })
      }
      openOptions(newOptions, id)
    } else {
      openOptions(options, id)
    }
  }

  const handleRemoveFilter = (id: string) => {
    // remove a filter by id
    const updatedFilters = filters.filter((filter) => filter.id !== id)
    onChange(updatedFilters)
    onFinish && onFinish(updatedFilters)
  }

  const handleInvertFilter = (id: string) => {
    // find the filter and update the inverted value
    const updatedFilters = filters.map((filter) =>
      filter.id === id ? { ...filter, inverted: !filter.inverted } : filter,
    )
    onChange(updatedFilters)
    onFinish && onFinish(updatedFilters)
  }

  const handleContainerKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    // cancel on esc
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      handleClose(filters)
    }
  }

  const handleSearchBarKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    // open on enter or space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      openOptions(options, null)
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
      {dropdownOptions && <Styled.Backdrop onClick={() => handleClose(filters)} />}
      <Styled.SearchBar
        className={clsx({ empty: !filters.length })}
        onClick={() => !filters.length && openInitialOptions()}
        onKeyDown={handleSearchBarKeyDown}
        tabIndex={0}
      >
        <Icon icon="search" className="search" onClick={openInitialOptions} />
        <Styled.SearchBarFilters ref={filtersRef}>
          {filters.map((filter, index) => (
            <SearchFilterItem
              key={filter.id + index}
              id={filter.id}
              label={filter.label}
              inverted={filter.inverted}
              values={filter.values}
              icon={filter.icon}
              isCustom={filter.isCustom}
              index={index}
              onEdit={handleEditFilter}
              onRemove={handleRemoveFilter}
              onInvert={handleInvertFilter}
            />
          ))}
        </Styled.SearchBarFilters>
        {filters.length ? (
          <Styled.FilterButton icon={'add'} variant="text" onClick={openInitialOptions} />
        ) : (
          <span>{getEmptyPlaceholder(disableSearch)}</span>
        )}
      </Styled.SearchBar>
      {dropdownOptions && (
        <SearchFilterDropdown
          options={dropdownOptions}
          values={filters}
          parentId={dropdownParentId}
          isCustomAllowed={getIsCustomAllowed(options, dropdownParentId)}
          onSelect={handleOptionSelect}
          onConfirmAndClose={(filters) => handleClose(filters)}
          ref={dropdownRef}
        />
      )}
    </Styled.Container>
  )
}

export default SearchFilter

const getEmptyPlaceholder = (disableSearch: boolean) => {
  return disableSearch ? 'Filter' : 'Search and filter'
}
const getOptionsWithSearch = (options: Option[], disableSearch: boolean) => {
  if (disableSearch) return options
  //  unshift search option
  const searchFilter: Option = {
    id: 'text',
    label: 'Text',
    icon: 'manage_search',
    inverted: false,
    values: [],
    allowsCustomValues: true,
  }

  return [searchFilter, ...options]
}

const getIsCustomAllowed = (options: Option[], parentId: string | null): boolean => {
  if (!parentId) return false
  const fieldName = getFilterFromId(parentId)
  const parentOption = options.find((option) => option.id === fieldName)
  return !!parentOption?.allowsCustomValues
}

const mergeOptionsWithFilterValues = (filter: Filter, options: Option[]): Option[] => {
  const filterName = getFilterFromId(filter.id)
  const filterOptions = options.find((option) => option.id === filterName)?.values || []

  const mergedOptions = [...filterOptions]

  filter.values?.forEach((value) => {
    if (!mergedOptions.some((option) => option.id === value.id)) {
      mergedOptions.push(value)
    }
  })

  return mergedOptions
}
