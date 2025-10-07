import React, { FC, useState, useRef, KeyboardEvent, ChangeEvent } from 'react'
import { matchSorter } from 'match-sorter'
import { InputText } from '@ynput/ayon-react-components'
import { AccessLevel } from '../AccessUser/AccessUser'
import * as Styled from './AccessSearchInput.styled'
import { AccessUser } from '../AccessUser/AccessUser'
import clsx from 'clsx'
import { ShareOption } from '@shared/api'

const MAX_USERS_DISPLAYED = 500
// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface AccessSearchInputProps extends React.HTMLAttributes<HTMLDivElement> {
  shareOptions: ShareOption[]
  existingAccess: string[] // Array of names already in access
  owner: string | undefined | null
  placeholder?: string
  disabled?: boolean
  mode?: 'internal' | 'external'
  onSelectOption: (option: ShareOption, accessLevel: AccessLevel) => void
  pt?: {
    list?: Partial<React.HTMLAttributes<HTMLUListElement>>
  }
}

export const AccessSearchInput: FC<AccessSearchInputProps> = ({
  shareOptions,
  existingAccess,
  owner,
  placeholder = 'Add people or access groups',
  disabled = false,
  mode = 'internal',
  onSelectOption,
  pt,
  ...props
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter and sort options based on search value, limit to first 4 results
  const filteredOptions = matchSorter(
    shareOptions.filter((option) => !existingAccess.includes(option.value)),
    searchValue,
    {
      keys: ['name', 'label', 'value'],
      threshold: matchSorter.rankings.CONTAINS,
    },
  ).slice(0, MAX_USERS_DISPLAYED)

  // Check if search value is a valid email and not already added
  const isValidNewEmail =
    EMAIL_REGEX.test(searchValue) &&
    !shareOptions.some((g) => g.name === searchValue) &&
    mode === 'external'

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  // Handle input blur
  const handleBlur = () => {
    // Delay closing to allow for option selection
    setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }, 200)
  }

  // Handle input change
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    setHighlightedIndex(-1)
    setIsOpen(true)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) {
      // If Enter is pressed and no options are highlighted, select the first option
      if (e.key === 'Enter' && filteredOptions.length > 0) {
        e.preventDefault()
        handleSelectOption(filteredOptions[0])
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[highlightedIndex])
        } else if (filteredOptions.length > 0) {
          // If no specific option is highlighted, select the first one
          handleSelectOption(filteredOptions[0])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        // stop dialog from closing
        e.stopPropagation()
        break
    }
  }

  // Handle option selection
  const handleSelectOption = (option: ShareOption) => {
    onSelectOption(option, 10) // Default access level is 10 (Read-only)
    setSearchValue('')
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  // Handle adding a new email
  const handleAddNewEmail = () => {
    onSelectOption(
      {
        name: searchValue,
        label: searchValue,
        value: searchValue,
        shareType: 'guest',
      },
      10,
    )
    setSearchValue('')
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <Styled.Container {...props}>
      <InputText
        ref={inputRef}
        value={searchValue}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={handleFocus}
        onClick={handleFocus}
        onBlur={handleBlur}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={{ width: '100%' }}
      />

      {isOpen && (filteredOptions.length > 0 || isValidNewEmail) && (
        <Styled.SuggestionsList
          {...pt?.list}
          className={clsx(pt?.list?.className, { 'no-owner': !owner })}
        >
          {filteredOptions.map((option, index) => (
            <AccessUser
              key={option.value}
              name={option.name}
              label={option.label}
              shareType={option.shareType}
              isOwner={false}
              isMe={false}
              data-index={index}
              className={index === highlightedIndex ? 'highlighted' : ''}
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectOption(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
              isCompact
              isSearchResult
            >
              {/* No controls needed for search suggestions */}
            </AccessUser>
          ))}

          {/* Add new email option */}
          {isValidNewEmail && (
            <AccessUser
              name={searchValue}
              label={searchValue}
              shareType="guest"
              isOwner={false}
              isMe={false}
              data-index={filteredOptions.length}
              className={filteredOptions.length === highlightedIndex ? 'highlighted' : ''}
              style={{ cursor: 'pointer' }}
              onClick={handleAddNewEmail}
              onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
              isCompact
              isSearchResult
            />
          )}

          {filteredOptions.length === MAX_USERS_DISPLAYED && (
            <li className="tip">More than 500 results, please refine your search...</li>
          )}
        </Styled.SuggestionsList>
      )}
    </Styled.Container>
  )
}
