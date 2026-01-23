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
  operator?: QueryCondition['operator']
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

const isSearchItem = (c: QueryCondition | QueryFilter, filterId: string): boolean => {
  if (isCondition(c)) return c.key === filterId
  return !!c.conditions?.some((sub) => isSearchItem(sub, filterId))
}

const stringifySearchFilter = (filter: QueryCondition | QueryFilter): string => {
  if (isCondition(filter)) return String(filter.value || '')

  const joiner = filter.operator === 'or' ? ', ' : '.'
  return filter.conditions?.map((c) => stringifySearchFilter(c)).join(joiner) || ''
}

const parseSearchValue = (
  val: string,
  key: string,
  operator: QueryCondition['operator'],
): QueryCondition | QueryFilter => {
  // Split by comma first (OR)
  const orTerms = val
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  if (orTerms.length > 1) {
    return {
      operator: 'or',
      conditions: orTerms.map((term) => parseSearchValue(term, key, operator)),
    }
  }

  const baseValue = orTerms[0] || val.trim()
  if (!baseValue || baseValue === ',' || baseValue === '.') {
    return {
      key,
      operator,
      value: '',
    }
  }

  // If no commas, split by period (AND)
  const andTerms = baseValue
    .split('.')
    .map((t) => t.trim())
    .filter(Boolean)

  if (andTerms.length > 1) {
    return {
      operator: 'and',
      conditions: andTerms.map((term) => ({
        key,
        operator,
        value: term,
      })),
    }
  }

  // Single term
  return {
    key,
    operator,
    value: andTerms[0] || '',
  }
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
      if (document.activeElement === searchInputRef.current) return
      const searchItem = currentFilter.conditions?.find((c) => isSearchItem(c, expandedSearchId))
      setSearchValue(searchItem ? stringifySearchFilter(searchItem) : '')
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

    const existingIndex = conditions.findIndex((c) => isSearchItem(c, filterId))

    const type = filter.type || 'boolean'

    if (type === 'boolean') {
      if (existingIndex > -1) {
        conditions.splice(existingIndex, 1)
      } else {
        conditions.push({ key: filterId, operator: filter.operator || 'eq', value: true })
      }
    } else if (type === 'enum') {
      const newValue = Array.isArray(value) ? value : [value]
      if (newValue.length === 0 || (newValue.length === 1 && newValue[0] === undefined)) {
        if (existingIndex > -1) conditions.splice(existingIndex, 1)
      } else {
        const condition: QueryCondition = {
          key: filterId,
          operator: filter.operator || 'in',
          value: newValue,
        }
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
        const parsedFilter = parseSearchValue(stringValue, filterId, filter.operator || 'like')
        if (existingIndex > -1) {
          conditions[existingIndex] = parsedFilter
        } else {
          conditions.push(parsedFilter)
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
      const searchItem = currentFilter.conditions?.find((c) => isSearchItem(c, filterId))
      setSearchValue(searchItem ? stringifySearchFilter(searchItem) : '')
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
    return currentFilter.conditions?.some((c) => isSearchItem(c, String(filter.id)))
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
