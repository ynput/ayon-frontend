// Tab-specific header with label and filters
// Currently only Feed has filters: activity, comments, versions, checklists

import { Icon, Spacer } from '@ynput/ayon-react-components'
import * as Styled from './TabHeaderAndFilters.styled'
import { QueryFilter, QueryCondition } from '@shared/api'
import { AttributeEnumItem } from '../../../../containers/ProjectTreeTable/types'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useDebouncedValue } from '@shared/hooks'
import clsx from 'clsx'

const SEARCH_DEBOUNCE_MS = 300

export interface FilterItem<T = string> {
  id: T
  tooltip: string
  icon: string
  type?: 'boolean' | 'enum' | 'search'
  options?: AttributeEnumItem[]
  placeholder?: string
  operator?: QueryCondition['operator']
  isShortcut?: boolean
}

interface TabHeaderAndFiltersProps<T, K = string> {
  label?: string
  filters: FilterItem<K>[]
  currentFilter: T
  onFilterChange: (filter: T) => void
  isLoading?: boolean
}

const isCondition = (c: QueryCondition | QueryFilter): c is QueryCondition => {
  return !!c && 'key' in c
}

const isImageIcon = (icon?: string): boolean =>
  !!icon && (icon.startsWith('/') || icon.startsWith('http'))

const renderIcon = (icon?: string, color?: string, className?: string) => {
  if (!icon) return null
  if (isImageIcon(icon)) {
    return <img src={icon} className={clsx('row-avatar', className)} alt="" />
  }
  return (
    <Icon icon={icon} className={className} style={color ? { color } : undefined} />
  )
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
  const searchFilterId = filters.find((f) => (f.type || 'boolean') === 'search')?.id
  const searchFilterIdStr = searchFilterId !== undefined ? String(searchFilterId) : null
  const [searchValue, setSearchValue] = useState<string>('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeEnumFilterId, setActiveEnumFilterId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownContainerRef = useRef<HTMLDivElement>(null)

  const nonSearchFilters = useMemo(
    () => filters.filter((f) => (f.type || 'boolean') !== 'search'),
    [filters],
  )

  const shortcutFilters = useMemo(() => filters.filter((f) => f.isShortcut), [filters])

  const dropdownFilters = useMemo(() => {
    const q = searchValue.trim().toLowerCase()
    if (!q) return nonSearchFilters
    return nonSearchFilters.filter((f) => f.tooltip.toLowerCase().includes(q))
  }, [nonSearchFilters, searchValue])

  const activeEnumFilter = useMemo(() => {
    if (!activeEnumFilterId) return null
    const f = filters.find((f) => String(f.id) === activeEnumFilterId)
    return f && (f.type || 'boolean') === 'enum' ? f : null
  }, [activeEnumFilterId, filters])

  useEffect(() => {
    if (!filtersOpen) setActiveEnumFilterId(null)
  }, [filtersOpen])

  const activeEnumOptions = useMemo(() => {
    if (!activeEnumFilter) return []
    const opts = activeEnumFilter.options || []
    const q = searchValue.trim().toLowerCase()
    if (!q) return opts
    return opts.filter((o) => String(o.label ?? o.value).toLowerCase().includes(q))
  }, [activeEnumFilter, searchValue])

  useEffect(() => {
    if (!filtersOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (dropdownContainerRef.current?.contains(target)) return
      // Keep open if click landed on a portaled list/option popup (e.g. enum picker)
      if (target.closest('ul[role="listbox"], li[role="option"], [class*="dropdown"]')) return
      setFiltersOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [filtersOpen])

  const isQueryFilter = (f: any): f is QueryFilter => {
    return typeof f === 'object' && f !== null && !Array.isArray(f)
  }

  // Sync search value with current filter
  useEffect(() => {
    if (searchFilterIdStr && isQueryFilter(currentFilter)) {
      if (document.activeElement === searchInputRef.current) return
      const searchItem = currentFilter.conditions?.find((c) => isSearchItem(c, searchFilterIdStr))
      setSearchValue(searchItem ? stringifySearchFilter(searchItem) : '')
    }
  }, [searchFilterIdStr, currentFilter])

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

  const pendingSearchFilterRef = useRef<FilterItem<K> | null>(null)
  const handleToggleRef = useRef(handleToggle)
  handleToggleRef.current = handleToggle
  const debouncedSearchValue = useDebouncedValue(searchValue, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    const filter = pendingSearchFilterRef.current
    if (!filter) return
    handleToggleRef.current(filter, debouncedSearchValue)
    pendingSearchFilterRef.current = null
  }, [debouncedSearchValue])

  const handleSearchChange = (filter: FilterItem<K>, value: string) => {
    setSearchValue(value)
    if (activeEnumFilterId) {
      pendingSearchFilterRef.current = null
      return
    }
    pendingSearchFilterRef.current = filter
  }

  const handleSearchClear = (filter: FilterItem<K>) => {
    setSearchValue('')
    pendingSearchFilterRef.current = null
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

  const searchFilter = filters.find((f) => (f.type || 'boolean') === 'search')
  const activeChips = filters
    .filter((f) => (f.type || 'boolean') !== 'search')
    .map((f) => {
      const type = f.type || 'boolean'
      if (type === 'enum') {
        const values = getEnumValue(f)
        if (!values.length) return null
        return { filter: f, type, values }
      }
      if (getIsSelected(f)) return { filter: f, type, values: [] as string[] }
      return null
    })
    .filter(Boolean) as Array<{ filter: FilterItem<K>; type: string; values: string[] }>

  return (
    <Styled.HeaderContainer className={clsx('panel-tabs', { loading: isLoading })}>
      {label ? (
        <>
          <Styled.HeaderLabel className="panel-header-label">{label}</Styled.HeaderLabel>
          <Spacer />
        </>
      ) : null}
      <Styled.FiltersContainer className="panel-header-filters">
        <Styled.SearchFilterContainer
          ref={dropdownContainerRef}
          className={clsx('panel-filter', 'panel-filter-search', {
            selected:
              activeChips.length > 0 || (searchFilter && !!getIsSelected(searchFilter)),
            open: filtersOpen,
          })}
        >
          <Icon icon="search" className="search-icon" />
          {activeChips.map(({ filter, type, values }) => (
            <Styled.FilterChip
              key={String(filter.id)}
              onClick={(e) => {
                e.stopPropagation()
                if (type === 'enum') {
                  setFiltersOpen(true)
                  setActiveEnumFilterId(String(filter.id))
                } else {
                  handleToggle(filter, undefined)
                }
              }}
              data-tooltip={type === 'enum' ? 'Edit filter' : 'Remove filter'}
              data-tooltip-delay={0}
            >
              <Icon icon={filter.icon} />
              <span className="chip-label">
                {filter.tooltip}
                {type === 'enum' && values.length ? ` (${values.length})` : ''}
              </span>
              <Icon
                icon="close"
                className="chip-remove"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  handleToggle(filter, type === 'enum' ? [] : undefined)
                }}
              />
            </Styled.FilterChip>
          ))}
          {searchFilter ? (
            <Styled.SearchInput
              ref={searchInputRef}
              value={searchValue}
              onChange={(e) => handleSearchChange(searchFilter, e.target.value)}
              onFocus={() => nonSearchFilters.length > 0 && setFiltersOpen(true)}
              onClick={() => nonSearchFilters.length > 0 && setFiltersOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  if (activeEnumFilterId) setActiveEnumFilterId(null)
                  else if (filtersOpen) setFiltersOpen(false)
                  else handleSearchClear(searchFilter)
                }
              }}
              placeholder={
                activeChips.length ? '' : searchFilter.placeholder || 'Search...'
              }
            />
          ) : (
            <Spacer />
          )}
          {searchFilter && searchValue ? (
            <Styled.ClearButton
              icon="close"
              onClick={() => handleSearchClear(searchFilter)}
              data-tooltip="Clear"
              data-tooltip-delay={0}
            />
          ) : null}

          {/* dropdown panels */}
          {filtersOpen && activeEnumFilter ? (
            <Styled.FilterDropdown>
              <Styled.FilterDropdownHeader>
                <Styled.BackButton
                  icon="arrow_back"
                  onClick={() => setActiveEnumFilterId(null)}
                  data-tooltip="Back"
                  data-tooltip-delay={0}
                />
                <Icon icon={activeEnumFilter.icon} />
                <span className="header-label">{activeEnumFilter.tooltip}</span>
              </Styled.FilterDropdownHeader>
              {activeEnumOptions.map((opt) => {
                const currentValues = getEnumValue(activeEnumFilter).map(String)
                const optId = String(opt.value)
                const isSelected = currentValues.includes(optId)
                const label = String(opt.label ?? opt.value)
                return (
                  <Styled.FilterDropdownRow
                    key={optId}
                    className={clsx({ selected: isSelected })}
                    onClick={() => {
                      const next = isSelected
                        ? currentValues.filter((v) => v !== optId)
                        : [...currentValues, optId]
                      handleToggle(activeEnumFilter, next)
                    }}
                  >
                    {renderIcon(opt.icon, opt.color)}
                    <span className="row-label">{label}</span>
                    {isSelected ? <Icon icon="check" className="check-icon" /> : null}
                  </Styled.FilterDropdownRow>
                )
              })}
            </Styled.FilterDropdown>
          ) : filtersOpen && nonSearchFilters.length > 0 && dropdownFilters.length > 0 ? (
            <Styled.FilterDropdown>
              {dropdownFilters.map((filter) => {
                const isSelected = !!getIsSelected(filter)
                const type = filter.type || 'boolean'

                if (type === 'enum') {
                  const enumValue = getEnumValue(filter)
                  return (
                    <Styled.FilterDropdownRow
                      key={String(filter.id)}
                      className={clsx({ selected: enumValue.length > 0 })}
                      onClick={() => setActiveEnumFilterId(String(filter.id))}
                    >
                      <Icon icon={filter.icon} />
                      <span className="row-label">
                        {filter.tooltip}
                        {enumValue.length ? ` (${enumValue.length})` : ''}
                      </span>
                      <Icon icon="chevron_right" className="chevron-icon" />
                    </Styled.FilterDropdownRow>
                  )
                }

                return (
                  <Styled.FilterDropdownRow
                    key={String(filter.id)}
                    className={clsx({ selected: isSelected })}
                    onClick={() => handleToggle(filter)}
                  >
                    <Icon icon={filter.icon} />
                    <span className="row-label">{filter.tooltip}</span>
                    {isSelected ? <Icon icon="check" className="check-icon" /> : null}
                  </Styled.FilterDropdownRow>
                )
              })}
            </Styled.FilterDropdown>
          ) : null}
        </Styled.SearchFilterContainer>
        {shortcutFilters.map((filter) => {
          const type = filter.type || 'boolean'
          const isActive =
            type === 'enum' ? getEnumValue(filter).length > 0 : !!getIsSelected(filter)
          return (
            <Styled.ShortcutButton
              key={String(filter.id)}
              icon={filter.icon}
              className={clsx({ active: isActive })}
              onClick={() => {
                if (type === 'enum') {
                  if (isActive) {
                    handleToggle(filter, [])
                  } else {
                    setFiltersOpen(true)
                    setActiveEnumFilterId(String(filter.id))
                  }
                } else {
                  handleToggle(filter)
                }
              }}
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
