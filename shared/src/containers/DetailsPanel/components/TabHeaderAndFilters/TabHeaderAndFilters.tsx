// Tab-specific header with label and filters
// Currently only Feed has filters: activity, comments, versions, checklists

import { Button, Spacer, Dropdown } from '@ynput/ayon-react-components'
import * as Styled from './TabHeaderAndFilters.styled'
import { QueryFilter, QueryCondition } from '@shared/api'
import { AttributeEnumItem } from '../../../../containers/ProjectTreeTable/types'
import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'

export interface FilterItem<T = string> {
  id: T
  tooltip: string
  icon: string
  type?: 'boolean' | 'enum' | 'search'
  options?: AttributeEnumItem[]
  placeholder?: string
}

interface TabHeaderAndFiltersProps<T, K = string> {
  label: string
  filters: FilterItem<K>[]
  currentFilter: T
  onFilterChange: (filter: T) => void
  isLoading?: boolean
}

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => {
  return !!c && 'key' in c
}

const TabHeaderAndFilters = <T, K = string>({
  label,
  filters,
  currentFilter,
  onFilterChange,
  isLoading,
}: TabHeaderAndFiltersProps<T, K>) => {
  const [expandedSearchId, setExpandedSearchId] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState<string>('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const isQueryFilter = (f: any): f is QueryFilter => {
    return typeof f === 'object' && f !== null && !Array.isArray(f)
  }

  // Focus input when search expands
  useEffect(() => {
    if (expandedSearchId && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [expandedSearchId])

  // Sync search value with current filter
  useEffect(() => {
    if (expandedSearchId && isQueryFilter(currentFilter)) {
      const condition = currentFilter.conditions?.find(
        (c) => isCondition(c) && c.key === expandedSearchId,
      ) as QueryCondition
      setSearchValue((condition?.value as string) || '')
    }
  }, [expandedSearchId, currentFilter])

  const handleToggle = (filter: FilterItem<K>, value?: any) => {
    if (!isQueryFilter(currentFilter)) {
      onFilterChange(filter.id as unknown as T)
      return
    }

    const conditions = currentFilter.conditions ? [...currentFilter.conditions] : []
    const newFilter: QueryFilter = {
      ...currentFilter,
      conditions,
      operator: currentFilter.operator || 'and',
    }

    const filterId = String(filter.id)

    const existingIndex = conditions.findIndex((c) => isCondition(c) && c.key === filterId)

    const type = filter.type || 'boolean'

    if (type === 'boolean') {
      if (existingIndex > -1) {
        conditions.splice(existingIndex, 1)
      } else {
        conditions.push({ key: filterId, operator: 'eq', value: true })
      }
    } else if (type === 'enum') {
      const newValue = Array.isArray(value) ? value : [value]
      if (newValue.length === 0 || (newValue.length === 1 && newValue[0] === undefined)) {
        if (existingIndex > -1) conditions.splice(existingIndex, 1)
      } else {
        const condition: QueryCondition = { key: filterId, operator: 'in', value: newValue }
        if (existingIndex > -1) {
          conditions[existingIndex] = condition
        } else {
          conditions.push(condition)
        }
      }
    } else if (type === 'search') {
      const stringValue = typeof value === 'string' ? value : ''
      if (!stringValue) {
        if (existingIndex > -1) conditions.splice(existingIndex, 1)
      } else {
        const condition: QueryCondition = { key: filterId, operator: 'like', value: stringValue }
        if (existingIndex > -1) {
          conditions[existingIndex] = condition
        } else {
          conditions.push(condition)
        }
      }
    }

    onFilterChange(newFilter as T)
  }

  const handleSearchClick = (filter: FilterItem<K>) => {
    const filterId = String(filter.id)
    if (expandedSearchId === filterId) {
      return // Already expanded
    }
    setExpandedSearchId(filterId)
    // Load existing value if any
    if (isQueryFilter(currentFilter)) {
      const condition = currentFilter.conditions?.find(
        (c) => isCondition(c) && c.key === filterId,
      ) as QueryCondition
      setSearchValue((condition?.value as string) || '')
    }
  }

  const handleSearchChange = (filter: FilterItem<K>, value: string) => {
    setSearchValue(value)
    handleToggle(filter, value)
  }

  const handleSearchClear = (filter: FilterItem<K>) => {
    setSearchValue('')
    setExpandedSearchId(null)
    handleToggle(filter, '')
  }

  const getIsSelected = (filter: FilterItem<K>) => {
    if (!isQueryFilter(currentFilter)) {
      return (filter.id as unknown as T) === currentFilter
    }
    return currentFilter.conditions?.some((c) => isCondition(c) && c.key === String(filter.id))
  }

  const getEnumValue = (filter: FilterItem<K>) => {
    if (!isQueryFilter(currentFilter)) return []
    const condition = currentFilter.conditions?.find(
      (c) => isCondition(c) && c.key === String(filter.id),
    ) as QueryCondition
    return (condition?.value as string[]) || []
  }

  return (
    <Styled.HeaderContainer className={isLoading ? 'loading' : ''}>
      <Styled.HeaderLabel>{label}</Styled.HeaderLabel>
      <Spacer />
      <Styled.FiltersContainer>
        {filters.map((filter) => {
          const isSelected = getIsSelected(filter)
          const type = filter.type || 'boolean'

          if (type === 'enum') {
            return (
              <Dropdown
                key={String(filter.id)}
                options={filter.options || []}
                value={getEnumValue(filter)}
                onChange={(val) => handleToggle(filter, val)}
                multiSelect
                align="right"
                valueTemplate={() => (
                  <Styled.FilterButton
                    selected={isSelected}
                    icon={filter.icon}
                    data-tooltip={filter.tooltip}
                    data-tooltip-delay={0}
                  />
                )}
                widthExpand
              />
            )
          }

          if (type === 'search') {
            const isExpanded = expandedSearchId === String(filter.id)
            return (
              <Styled.SearchFilterContainer
                key={String(filter.id)}
                className={clsx({ expanded: isExpanded })}
              >
                <Styled.FilterButton
                  selected={isSelected || isExpanded}
                  onClick={() => handleSearchClick(filter)}
                  icon={filter.icon}
                  data-tooltip={!isExpanded ? filter.tooltip : undefined}
                  data-tooltip-delay={0}
                />
                {isExpanded && (
                  <>
                    <Styled.SearchInput
                      ref={searchInputRef}
                      value={searchValue}
                      onChange={(e) => handleSearchChange(filter, e.target.value)}
                      placeholder={filter.placeholder || 'Search...'}
                    />
                    <Styled.ClearButton
                      icon="close"
                      onClick={() => handleSearchClear(filter)}
                      data-tooltip="Clear"
                      data-tooltip-delay={0}
                    />
                  </>
                )}
              </Styled.SearchFilterContainer>
            )
          }

          return (
            <Styled.FilterButton
              key={String(filter.id)}
              selected={isSelected}
              onClick={() => handleToggle(filter)}
              icon={filter.icon}
              data-tooltip={filter.tooltip}
              data-tooltip-delay={0}
            />
          )
        })}
      </Styled.FiltersContainer>
    </Styled.HeaderContainer>
  )
}

export default TabHeaderAndFilters
