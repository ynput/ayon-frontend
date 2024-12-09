import { forwardRef, useMemo, useState } from 'react'
import { Filter, FilterOperator, Option } from '../types'
import * as Styled from './SearchFilterDropdown.styled'
import { Button, Icon, InputSwitch, Spacer } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { matchSorter } from 'match-sorter'
import checkColorBrightness from '../checkColorBrightness'
import buildFilterId from '../buildFilterId'
import { FilterFieldType } from '@hooks/useBuildFilterOptions'
import getFilterFromId from '../getFilterFromId'

type OnSelectConfig = {
  confirm?: boolean
  restart?: boolean
  previous?: string // used to go back to the previous field along with restart
}

export interface SearchFilterDropdownProps {
  options: Option[]
  values: Filter[]
  parentId: string | null
  parentLabel?: string
  isCustomAllowed: boolean
  isHasValueAllowed?: boolean
  isNoValueAllowed?: boolean
  isInvertedAllowed?: boolean
  operatorChangeable?: boolean
  onSelect: (option: Option, config?: OnSelectConfig) => void
  onInvert: (id: string) => void // invert the filter
  onOperatorChange?: (id: string, operator: FilterOperator) => void // change the operator
  onConfirmAndClose?: (filters: Filter[], config?: OnSelectConfig) => void // close the dropdown and update the filters
  onSwitchFilter?: (direction: 'left' | 'right') => void // switch to the next filter to edit
}

const SearchFilterDropdown = forwardRef<HTMLUListElement, SearchFilterDropdownProps>(
  (
    {
      options,
      values,
      parentId,
      parentLabel,
      isCustomAllowed,
      isHasValueAllowed,
      isNoValueAllowed,
      isInvertedAllowed,
      operatorChangeable,
      onSelect,
      onInvert,
      onOperatorChange,
      onConfirmAndClose,
      onSwitchFilter,
    },
    ref,
  ) => {
    const parentFilter = values.find((filter) => filter.id === parentId)

    const [search, setSearch] = useState('')

    // sort options based on selected, skipping certain fields
    const sortedOptions = useMemo(() => {
      // do not sort for fields that have set order
      const doNotSortFields: FilterFieldType[] = ['entitySubType', 'status']
      // if the option has an icon, it is most likely an enum and do not sort
      const anyIcons = options.some((option) => option.icon)

      // should we sort?
      if (!parentId || doNotSortFields.includes(parentId as FilterFieldType) || anyIcons)
        return options

      const selectedOptions = options.filter((option) => {
        const isSelected = getIsValueSelected(option.id, parentId, values)
        return isSelected
      })
      const unselectedOptions = options.filter((option) => {
        const isSelected = getIsValueSelected(option.id, parentId, values)
        return !isSelected
      })
      return [...selectedOptions, ...unselectedOptions]
    }, [options])

    // add any extra options
    const allOptions = useMemo(() => {
      let optionsList = [...sortedOptions]
      if (parentId && isHasValueAllowed) {
        optionsList = [
          {
            id: 'hasValue',
            label: `Has ${parentLabel}`,
            parentId,
            values: [],
            icon: 'check',
          },
          ...optionsList,
        ]
      }
      if (parentId && isNoValueAllowed) {
        optionsList = [
          {
            id: 'noValue',
            label: `No ${parentLabel}`,
            parentId,
            values: [],
            icon: 'unpublished',
          },
          ...optionsList,
        ]
      }
      return optionsList
    }, [sortedOptions, parentId, parentLabel, isHasValueAllowed, isNoValueAllowed])

    // filter options based on search
    const filteredOptions = useMemo(
      () => getFilteredOptions(allOptions, search),
      [allOptions, search],
    )

    const handleSelectOption = (
      event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    ) => {
      event.preventDefault()
      event.stopPropagation()

      const target = event.target as HTMLElement
      const id = target.closest('li')?.id

      // get option by id
      const option = allOptions.find((option) => option.id === id)
      if (!option) return console.error('Option not found:', id)

      const closeOptions =
        (option.id === 'hasValue' || option.id === 'noValue') && values.length === 0

      onSelect(option, { confirm: closeOptions, restart: closeOptions })
      // clear search
      setSearch('')
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      // cancel on esc
      if ([' ', 'Enter'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        if (event.key === 'Enter') {
          //  shift + enter will confirm but keep the dropdown open
          //  any other enter will confirm and close dropdown
          onConfirmAndClose && onConfirmAndClose(values, { restart: event.shiftKey })
        }
      }
      // up arrow
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        event.stopPropagation()
        const target = event.target as HTMLElement
        const prev = target.previousElementSibling as HTMLElement
        // if the previous element is the search input, focus the input
        if (prev?.classList.contains('search')) {
          const input = prev.querySelector('input') as HTMLElement
          input.focus()
        } else {
          prev?.focus()
        }
      }
      // down arrow
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        const target = event.target as HTMLElement
        const next = target.nextElementSibling as HTMLElement
        next?.focus()
      }
      // arrow left or right
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        event.stopPropagation()
        // trigger event to switch to next filter to edit, logic in parent
        onSwitchFilter && onSwitchFilter(event.key === 'ArrowRight' ? 'right' : 'left')
      }

      // back key
      if (event.key === 'Backspace' && !search) {
        event.preventDefault()
        event.stopPropagation()

        if (!parentFilter?.values?.length && parentId) {
          const previousField = getFilterFromId(parentId)
          handleBack(previousField)
        }
      }
    }

    const handleSearchSubmit = () => {
      const addedOption = getAddOption(search, filteredOptions, parentId, isCustomAllowed)
      if (!addedOption) return

      // add the first option
      onSelect(addedOption, { confirm: true, restart: true })
      // clear search
      setSearch('')
    }

    const handleBack = (previousField?: string) => {
      // remove the parentId value if the filter has no values
      const newValues = values.filter(
        (filter) => !(filter.id === parentId && !filter.values?.length),
      )

      onConfirmAndClose && onConfirmAndClose(newValues, { restart: true, previous: previousField })
    }

    const handleCustomSearchShortcut = () => {
      // check there is a text option
      const hasTextOption = allOptions.some((option) => option.id === 'text')
      if (!hasTextOption) return

      const newId = buildFilterId('text')

      const newFilter: Filter = {
        id: newId,
        label: 'Text',
        values: [{ id: search, label: search, parentId: newId, isCustom: true }],
      }

      onConfirmAndClose && onConfirmAndClose([...values, newFilter])
    }

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      // enter will select the first option
      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()

        if (search && !parentId && filteredOptions.length === 0) {
          // if the root field search has no results, add the custom value as text
          handleCustomSearchShortcut()
        } else {
          // otherwise, add the first option
          handleSearchSubmit()
        }
      }
      // arrow down will focus the first option
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        event.stopPropagation()
        const target = event.target as HTMLElement
        const next = target.parentElement?.nextElementSibling as HTMLElement
        next?.focus()
      }
    }

    return (
      <Styled.OptionsContainer onKeyDown={handleKeyDown}>
        <Styled.Scrollable>
          <Styled.OptionsList ref={ref}>
            <Styled.SearchContainer className="search">
              <Styled.SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={getSearchPlaceholder(isCustomAllowed, allOptions)}
                autoFocus
              />
              <Styled.SearchIcon icon={isCustomAllowed ? 'zoom_in' : 'search'} />
              {isCustomAllowed && (
                <Styled.AddSearch
                  icon="add"
                  variant="text"
                  onClick={handleSearchSubmit}
                  disabled={!search}
                >
                  Add
                </Styled.AddSearch>
              )}
            </Styled.SearchContainer>
            {filteredOptions.map(({ id, parentId, label, icon, img, color }) => {
              const isSelected = getIsValueSelected(id, parentId, values)
              const adjustedColor = color ? checkColorBrightness(color, '#1C2026') : undefined
              return (
                <Styled.Item
                  key={id}
                  id={id}
                  tabIndex={0}
                  className={clsx({ selected: isSelected })}
                  onClick={(event) => handleSelectOption(event)}
                >
                  {icon && <Icon icon={icon} style={{ color: adjustedColor }} />}
                  {img && <img src={img} alt={label} />}
                  <span className="label" style={{ color: adjustedColor }}>
                    {label}
                  </span>
                  {isSelected && <Icon icon="check" className="check" />}
                </Styled.Item>
              )
            })}
            {filteredOptions.length === 0 && !isCustomAllowed && <span>No filters found</span>}
            {parentId && (
              <Styled.Toolbar className="toolbar">
                <Button variant="text" onClick={() => handleBack()} icon="arrow_back">
                  Back
                </Button>
                <Spacer />
                {isInvertedAllowed && (
                  <>
                    <span>Excludes</span>
                    <InputSwitch
                      checked={parentFilter?.inverted}
                      onChange={() => onInvert(parentId)}
                    />
                  </>
                )}
                {operatorChangeable && (
                  <Styled.Operator>
                    {['AND', 'OR'].map((operator) => (
                      <Button
                        key={operator}
                        onClick={() => {
                          onOperatorChange && onOperatorChange(parentId, operator as FilterOperator)
                        }}
                        selected={parentFilter?.operator === operator}
                        icon={parentFilter?.operator === operator ? 'check' : undefined}
                      >
                        {operator}
                      </Button>
                    ))}
                  </Styled.Operator>
                )}
                <Button
                  variant="filled"
                  onClick={() => {
                    onConfirmAndClose && onConfirmAndClose(values)
                  }}
                  icon="check"
                >
                  Confirm
                </Button>
              </Styled.Toolbar>
            )}
          </Styled.OptionsList>
        </Styled.Scrollable>
      </Styled.OptionsContainer>
    )
  },
)

export default SearchFilterDropdown

export const getIsValueSelected = (
  id: string,
  parentId?: string | null,
  values?: Filter[],
): boolean => {
  if (!parentId || !values) return false
  // find the parent filter
  const parentFilter = values.find((filter) => filter.id === parentId)
  if (!parentFilter) return false

  // check if the value is already selected
  return !!parentFilter.values?.some((value) => value.id === id)
}

const getFilteredOptions = (options: Option[], search: string) => {
  // filter out options that don't match the search in any of the fields

  // no search? return all options
  if (!search) return options

  const parsedSearch = search.toLowerCase()

  return matchSorter(options, parsedSearch, {
    keys: ['label', 'context', 'keywords'],
  })
}

const getSearchPlaceholder = (isCustomAllowed: boolean, options: Option[]) => {
  const somePreMadeOptions = options.length > 0 && options.some((option) => !option.isCustom)

  return !somePreMadeOptions && isCustomAllowed
    ? 'Add filter text...'
    : isCustomAllowed
    ? 'Search or add filter text...'
    : 'Search...'
}

const getAddOption = (
  customValue: string,
  options: Option[],
  parentId: string | null,
  isCustomAllowed?: boolean,
): Option | null => {
  if (customValue && parentId && isCustomAllowed) {
    // add custom value
    return { id: customValue, label: customValue, values: [], parentId, isCustom: true }
  } else if (!isCustomAllowed && options.length) {
    return options[0]
  } else {
    return null
  }
}
