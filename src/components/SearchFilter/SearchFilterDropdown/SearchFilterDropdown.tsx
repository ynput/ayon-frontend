import { forwardRef, useMemo, useState } from 'react'
import { Filter, Option } from '../types'
import * as Styled from './SearchFilterDropdown.styled'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { matchSorter } from 'match-sorter'

type OnSelectConfig = {
  confirm: boolean
}

export interface SearchFilterDropdownProps {
  options: Option[]
  values: Filter[]
  onSelect: (option: Option, config?: OnSelectConfig) => void
}

const SearchFilterDropdown = forwardRef<HTMLUListElement, SearchFilterDropdownProps>(
  ({ options, values, onSelect }, ref) => {
    const [search, setSearch] = useState('')

    // 1. filter options based on search
    const filteredOptions = useMemo(() => getFilteredOptions(options, search), [options, search])

    const handleSelectOption = (
      event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    ) => {
      event.preventDefault()
      event.stopPropagation()

      const target = event.target as HTMLElement
      const id = target.closest('li')?.id

      // get option by id
      const option = options.find((option) => option.id === id)
      if (!option) return console.error('Option not found:', id)

      onSelect(option)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      // cancel on esc
      if ([' ', 'Enter'].includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        handleSelectOption(event)
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
    }

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      // enter will select the first option
      if (event.key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        if (!search || !filteredOptions[0]) return
        // add the first option
        onSelect(filteredOptions[0], { confirm: true })
        // reset search
        setSearch('')
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
      <Styled.OptionsContainer onKeyDown={handleKeyDown} ref={ref}>
        <Styled.SearchContainer className="search">
          <Styled.SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={'Search...'}
            autoFocus
          />
          <Styled.SearchIcon icon="search" />
        </Styled.SearchContainer>
        {filteredOptions.map(({ id, parentId, label, icon, img, color }) => {
          const isSelected = getIsValueSelected(id, parentId, values)
          return (
            <Styled.Item
              key={id}
              id={id}
              tabIndex={0}
              className={clsx({ selected: isSelected })}
              onClick={(event) => handleSelectOption(event)}
            >
              {icon && <Icon icon={icon} style={{ color: color || undefined }} />}
              {img && <img src={img} alt={label} />}
              <span className="label" style={{ color: color || undefined }}>
                {label}
              </span>
              {isSelected && <Icon icon="check" className="check" />}
            </Styled.Item>
          )
        })}
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
