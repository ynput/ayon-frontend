import { Icon } from '@ynput/ayon-react-components'
import { useURIContext } from '@shared/context'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'

import * as Styled from './GlobalProjectSearch.styled'
import {
  GlobalSearchResult,
  useGlobalProjectSearch,
} from './useGlobalProjectSearch'

type Props = {
  projectName: string
  onClose?: () => void
  triggerRef?: RefObject<HTMLElement>
}

const getContextLabel = ({ entityType, pathLabel, subType }: GlobalSearchResult) => {
  const entityLabel = [entityType, subType].filter(Boolean).join(' · ')
  return [entityLabel, pathLabel].filter(Boolean).join(' • ')
}

const GlobalSearchResultMedia = ({ result }: { result: GlobalSearchResult }) => {
  const [hasThumbnailError, setHasThumbnailError] = useState(false)

  if (result.thumbnailUrl && !hasThumbnailError) {
    return (
      <Styled.ResultMedia>
        <Styled.ResultThumbnail
          src={result.thumbnailUrl}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setHasThumbnailError(true)}
        />
      </Styled.ResultMedia>
    )
  }

  return (
    <Styled.ResultMedia>
      <Icon
        icon={result.icon}
        className="result-icon"
        style={result.iconColor ? { color: result.iconColor } : undefined}
      />
    </Styled.ResultMedia>
  )
}

const GlobalProjectSearch = ({ projectName, onClose, triggerRef }: Props) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUri } = useURIContext()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const listId = useId()

  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const trimmedSearch = search.trim()
  const hasSearch = !!trimmedSearch

  const { results, isLoading, isFetching } = useGlobalProjectSearch({
    projectName,
    search: trimmedSearch,
    limit: 8,
  })

  const showEmptyState = hasSearch && !isLoading && !isFetching && !results.length
  const showDropdown = isOpen && hasSearch && (isLoading || isFetching || !!results.length || showEmptyState)

  const closeDropdown = () => {
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const resetSearch = () => {
    setSearch('')
    closeDropdown()
  }

  const closeSearch = useCallback(() => {
    setSearch('')
    setIsOpen(false)
    setHighlightedIndex(-1)
    inputRef.current?.blur()
    onClose?.()
  }, [onClose])

  const handleSelect = (result: GlobalSearchResult) => {
    closeSearch()
    setUri(result.uri)
    navigate(result.targetUrl)
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return
      if (triggerRef?.current?.contains(target)) return

      closeSearch()
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [closeSearch, triggerRef])

  useEffect(() => {
    resetSearch()
  }, [location.pathname, projectName])

  useEffect(() => {
    if (!results.length) {
      setHighlightedIndex(-1)
      return
    }

    setHighlightedIndex((currentIndex) =>
      currentIndex >= results.length ? results.length - 1 : currentIndex,
    )
  }, [results])

  useEffect(() => {
    if (highlightedIndex < 0) return
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    const nextSearch = value.trim()

    setSearch(value)
    setHighlightedIndex(-1)
    setIsOpen(!!nextSearch)
  }

  const handleFocus = () => {
    if (trimmedSearch) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        if (!results.length) return
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex((currentIndex) =>
          currentIndex < results.length - 1 ? currentIndex + 1 : 0,
        )
        break
      case 'ArrowUp':
        if (!results.length) return
        event.preventDefault()
        setIsOpen(true)
        setHighlightedIndex((currentIndex) =>
          currentIndex > 0 ? currentIndex - 1 : results.length - 1,
        )
        break
      case 'Enter': {
        if (!hasSearch || !results.length) return
        event.preventDefault()
        handleSelect(results[highlightedIndex >= 0 ? highlightedIndex : 0])
        break
      }
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        closeSearch()
        break
    }
  }

  return (
    <Styled.Container ref={containerRef}>
      <Styled.SearchField>
        <Icon icon="search" className="search-icon" />
        <Styled.SearchInput
          ref={inputRef}
          value={search}
          placeholder="Search this project..."
          onChange={handleChange}
          onFocus={handleFocus}
          onClick={handleFocus}
          onKeyDown={handleKeyDown}
          aria-label={`Search within project ${projectName}`}
          aria-autocomplete="list"
          aria-controls={showDropdown ? listId : undefined}
          aria-expanded={showDropdown}
          autoComplete="off"
        />
      </Styled.SearchField>

      {showDropdown && (
        <Styled.Dropdown id={listId} role="listbox">
          {results.map((result, index) => (
            <Styled.ResultButton
              key={result.id}
              ref={(element) => {
                optionRefs.current[index] = element
              }}
              type="button"
              role="option"
              className={clsx({ highlighted: index === highlightedIndex })}
              aria-selected={index === highlightedIndex}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => handleSelect(result)}
            >
              <GlobalSearchResultMedia result={result} />
              <Styled.ResultBody>
                <Styled.PrimaryText>{result.label || result.name}</Styled.PrimaryText>
                <Styled.SecondaryText>{getContextLabel(result)}</Styled.SecondaryText>
              </Styled.ResultBody>
            </Styled.ResultButton>
          ))}

          {!results.length && (
            <Styled.StatusRow>{isLoading || isFetching ? 'Searching...' : 'No matches found'}</Styled.StatusRow>
          )}
        </Styled.Dropdown>
      )}
    </Styled.Container>
  )
}

export default GlobalProjectSearch
