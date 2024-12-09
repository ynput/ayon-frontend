import { FC, useRef, useState } from 'react'
import { Filter, FilterOperator, Option } from './types'
import * as Styled from './SearchFilter.styled'
import { Icon } from '@ynput/ayon-react-components'
import { SearchFilterItem } from './SearchFilterItem'
import SearchFilterDropdown, {
  getIsValueSelected,
  SearchFilterDropdownProps,
} from './SearchFilterDropdown/SearchFilterDropdown'
import { useFocusOptions } from './hooks'
import buildFilterId from './buildFilterId'
import getFilterFromId from './getFilterFromId'
import doesFilterExist from './doesFilterExist'

const sortSelectedToTopFields = ['assignee', 'taskType']

export interface SearchFilterProps {
  filters: Filter[]
  onChange: (filters: Filter[]) => void
  onFinish?: (filters: Filter[]) => void
  options: Option[]
  allowGlobalSearch?: boolean
  allowMultipleSameFilters?: boolean
  disabledFilters?: string[] // filters that should be disabled from adding, editing, or removing
}

const SearchFilter: FC<SearchFilterProps> = ({
  filters = [],
  onChange,
  onFinish,
  options: initOptions = [],
  allowGlobalSearch = false,
  allowMultipleSameFilters = false,
  disabledFilters,
}) => {
  const filtersRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

  const options = getOptionsWithSearch(initOptions, allowGlobalSearch)

  const [dropdownParentId, setDropdownParentId] = useState<null | string>(null)
  const [dropdownOptions, setOptions] = useState<Option[] | null>(null)

  const parentOption = options.find(
    (option) => dropdownParentId && option.id === getFilterFromId(dropdownParentId),
  )

  useFocusOptions({ ref: dropdownRef, options: dropdownOptions })

  const openOptions = (options: Option[], parentId: string | null) => {
    setOptions(options)
    setDropdownParentId(parentId)
  }

  const openInitialOptions = () => {
    openOptions(
      getShownRootOptions(options, filters, allowMultipleSameFilters, disabledFilters),
      null,
    )
  }

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

    // check if the filter already exists and if we allow multiple of the same filter
    if (!allowMultipleSameFilters && doesFilterExist(option.id, filters)) return

    // create new id for the filter so we can add multiple of the same filter name
    const newId = buildFilterId(option.id)
    // check if there is a parent id
    if (parentId) {
      // find the parent filter
      const parentFilter = filters.find((filter) => filter.id === parentId)

      // add to the parent filter values
      if (parentFilter) {
        const valueAlreadyExists = parentFilter.values?.some((val) => val.id === option.id)

        let updatedValues =
          valueAlreadyExists && parentFilter.values
            ? // If the option already exists, remove it
              parentFilter.values.filter((val) => val.id !== option.id)
            : // Otherwise, add the new option to the values array
              [...(parentFilter.values || []), option]

        // if the option is hasValue or noValue, remove all other options
        if (option.id === 'hasValue' || option.id === 'noValue') {
          updatedValues = updatedValues.filter((val) => val.id === option.id)
        } else {
          // remove hasValue and noValue if a specific value is added
          updatedValues = updatedValues.filter(
            (val) => val.id !== 'hasValue' && val.id !== 'noValue',
          )
        }

        // Create a new parent filter with the updated values
        const updatedParentFilter = {
          ...parentFilter,
          values: updatedValues,
        }

        // Update the filters array by replacing the parent filter with the updated one
        const updatedFilters = filters.map((filter) =>
          filter.id === parentId ? updatedParentFilter : filter,
        )

        // Call the onChange callback with the updated filters
        onChange(updatedFilters)

        if (config?.confirm && !config.restart) {
          // close the dropdown with the new filters
          handleClose(updatedFilters)
        } else if (config?.restart) {
          // go back to initial options
          openInitialOptions()
        }
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
    // close the dropdown
    closeOptions()
  }

  const handleInvertFilter = (id: string) => {
    // find the filter and update the inverted value
    const updatedFilters = filters.map((filter) =>
      filter.id === id ? { ...filter, inverted: !filter.inverted } : filter,
    )
    onChange(updatedFilters)
    onFinish && onFinish(updatedFilters)
  }

  const handleFilterOperatorChange = (id: string, operator: FilterOperator) => {
    // find the filter and update the operator value
    const updatedFilters = filters.map((filter) =>
      filter.id === id ? { ...filter, operator } : filter,
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

  // focus a different filter to edit
  const handleSwitchFilterFocus = (direction: 'left' | 'right') => {
    // get current filter from dropdownParentId
    const filterIndex = filters.findIndex((filter) => filter.id === dropdownParentId)
    // get next filter
    const nextFilter = filters[filterIndex + (direction === 'right' ? 1 : -1)]
    if (!nextFilter) return

    // open options for the next filter
    handleEditFilter(nextFilter.id)
  }

  const handleConfirmAndClose: SearchFilterDropdownProps['onConfirmAndClose'] = (
    filters,
    config,
  ) => {
    if (config?.restart) {
      // update filters
      onChange(filters)
      // go back to initial options
      openInitialOptions()

      if (config.previous) {
        // find the filter element by the id and focus it
        // @ts-ignore
        setTimeout(() => document.getElementById(config.previous)?.focus(), 50)
      }
    } else {
      // close the dropdown
      handleClose(filters)
    }
  }

  return (
    <Styled.Container onKeyDown={handleContainerKeyDown}>
      {dropdownOptions && <Styled.Backdrop onClick={() => handleClose(filters)} />}
      <Styled.SearchBar
        onClick={openInitialOptions}
        onKeyDown={handleSearchBarKeyDown}
        tabIndex={0}
      >
        <Icon icon="search" className="search" />
        <Styled.SearchBarFilters ref={filtersRef}>
          {filters.map((filter, index) => (
            <SearchFilterItem
              key={filter.id + index}
              id={filter.id}
              label={filter.label}
              inverted={filter.inverted}
              operator={filter.operator}
              values={filter.values}
              icon={filter.icon}
              isCustom={filter.isCustom}
              index={index}
              isEditing={dropdownParentId === filter.id}
              isDisabled={disabledFilters?.includes(getFilterFromId(filter.id))}
              isReadonly={filter.isReadonly}
              onEdit={handleEditFilter}
              onRemove={handleRemoveFilter}
              onInvert={handleInvertFilter}
            />
          ))}
        </Styled.SearchBarFilters>
        {filters.length ? (
          <Styled.FilterButton icon={'add'} variant="text" />
        ) : (
          <span>{getEmptyPlaceholder(allowGlobalSearch)}</span>
        )}
      </Styled.SearchBar>
      {dropdownOptions && (
        <SearchFilterDropdown
          options={dropdownOptions}
          values={filters}
          parentId={dropdownParentId}
          parentLabel={parentOption?.label}
          isCustomAllowed={!!parentOption?.allowsCustomValues}
          isHasValueAllowed={!!parentOption?.allowHasValue}
          isNoValueAllowed={!!parentOption?.allowNoValue}
          isInvertedAllowed={!!parentOption?.allowExcludes}
          onSelect={handleOptionSelect}
          onInvert={handleInvertFilter}
          onOperatorChange={handleFilterOperatorChange}
          onConfirmAndClose={handleConfirmAndClose}
          onSwitchFilter={handleSwitchFilterFocus}
          ref={dropdownRef}
        />
      )}
    </Styled.Container>
  )
}

export default SearchFilter

const getEmptyPlaceholder = (allowGlobalSearch: boolean) => {
  return allowGlobalSearch ? 'Search and filter' : 'Filter'
}
const getOptionsWithSearch = (options: Option[], allowGlobalSearch: boolean) => {
  if (!allowGlobalSearch) return options
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

// get all the top level fields that should be shown depending on the filters and allowMultipleSameFilters and disabledFilters
const getShownRootOptions = (
  options: Option[],
  filters: Filter[],
  allowMultipleSameFilters: boolean,
  disabledFilters: string[] = [],
): Option[] => {
  return options.filter((option) => {
    if (disabledFilters.includes(option.id)) return false
    if (!allowMultipleSameFilters) {
      return !doesFilterExist(option.id, filters)
    }
    return true
  })
}

const mergeOptionsWithFilterValues = (filter: Filter, options: Option[]): Option[] => {
  const filterName = getFilterFromId(filter.id)
  const filterOptions = options.find((option) => option.id === filterName)?.values || []

  const mergedOptions = [...filterOptions]

  filter.values?.forEach((value) => {
    if (value.id === 'hasValue' || value.id === 'noValue') return
    if (!mergedOptions.some((option) => option.id === value.id)) {
      mergedOptions.push(value)
    }
  })

  return mergedOptions
}
