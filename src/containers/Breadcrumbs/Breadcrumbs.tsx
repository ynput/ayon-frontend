import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Button, Icon, InputText } from '@ynput/ayon-react-components'
import * as Styled from './Breadcrumbs.styled'

import { upperFirst } from 'lodash'
import { copyToClipboard } from '@shared/util'
import { useURIContext } from '@shared/context'
import clsx from 'clsx'
import { useLocation, useNavigate } from 'react-router-dom'

import * as SearchStyled from '../header/GlobalSearch/GlobalProjectSearch.styled'
import {
  useGlobalProjectSearch,
} from '../header/GlobalSearch/useGlobalProjectSearch'
import type { GlobalSearchResult } from '../header/GlobalSearch/useGlobalProjectSearch'

const parseQueryParams = (query: string): Record<string, string> => {
  if (!query) return {}

  const params: Record<string, string> = {}
  const urlParams = new URLSearchParams(query)

  urlParams.forEach((value, key) => {
    params[key] = decodeURIComponent(value)
  })

  return params
}

const getSettingsScopeLabel = (query: string): string => {
  return query?.includes('project') ? 'Projects Manager' : 'Studio Settings'
}

const getPathnameLabel = (pathname: string): string => {
  const pageTitle = pathname.split('/')[1]

  if (pageTitle?.includes('settings')) return 'Studio Settings'
  if (pageTitle?.includes('manageProjects')) return 'Projects Manager'

  return ''
}

const uri2crumbs = (uri: string = '', pathname: string): string[] => {
  const [scope, pathAndQuery = ''] = (uri || '').split('://')
  const [path, query] = pathAndQuery.split('?')
  const crumbs: string[] = path.split('/').filter(Boolean)

  // Add scope-based label
  if (scope?.includes('ayon+settings')) {
    crumbs.unshift(getSettingsScopeLabel(query))
  } else if (scope?.includes('ayon+entity')) {
    crumbs.unshift('Project')
  } else {
    const pathnameLabel = getPathnameLabel(pathname)
    if (pathnameLabel) {
      crumbs.unshift(pathnameLabel)
    } else {
      crumbs.unshift(...pathname.slice(1).split('/').filter(Boolean).map(upperFirst))
    }
  }

  // Add query parameter breadcrumbs
  const queryParams = parseQueryParams(query)
  const queryLevels = ['product', 'task', 'workfile', 'version', 'representation']

  queryLevels.forEach((level) => {
    if (queryParams[level]) {
      crumbs.push(queryParams[level])
    }
  })

  return crumbs
}

type Props = {
  projectName?: string
}

type EditMode = 'view' | 'edit'

const getContextLabel = ({ entityType, pathLabel, subType }: GlobalSearchResult) => {
  const entityLabel = [entityType, subType].filter(Boolean).join(' · ')
  return [entityLabel, pathLabel].filter(Boolean).join(' • ')
}

const GlobalSearchResultMedia = ({ result }: { result: GlobalSearchResult }) => {
  const [hasThumbnailError, setHasThumbnailError] = useState(false)

  if (result.thumbnailUrl && !hasThumbnailError) {
    return (
      <SearchStyled.ResultMedia>
        <SearchStyled.ResultThumbnail
          src={result.thumbnailUrl}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setHasThumbnailError(true)}
        />
      </SearchStyled.ResultMedia>
    )
  }

  return (
    <SearchStyled.ResultMedia>
      <Icon
        icon={result.icon}
        className="result-icon"
        style={result.iconColor ? { color: result.iconColor } : undefined}
      />
    </SearchStyled.ResultMedia>
  )
}

const Breadcrumbs = ({ projectName }: Props) => {
  const location = useLocation()
  const navigate = useNavigate()
  const browserLocation = window.location

  const [localUri, setLocalUri] = useState<string>('')
  const [editMode, setEditMode] = useState<EditMode>('view')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const { uri = '', setUri } = useURIContext()

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const listId = useId()
  const canSearchProject = !!projectName?.trim()
  const isEditing = editMode !== 'view'
  const trimmedInput = localUri.trim()
  const hasSearch = isEditing && canSearchProject && !!trimmedInput

  const { results, isLoading, isFetching } = useGlobalProjectSearch({
    projectName,
    search: hasSearch ? trimmedInput : '',
    limit: 8,
  })

  const showEmptyState = hasSearch && !isLoading && !isFetching && !results.length
  const showDropdown = hasSearch && (isLoading || isFetching || !!results.length || showEmptyState)

  // keep localUri in sync with real uri
  useEffect(() => {
    setLocalUri(uri)
  }, [uri])

  useEffect(() => {
    setEditMode('view')
    setHighlightedIndex(-1)
  }, [location.pathname, projectName])

  //   when editing, select all text
  useEffect(() => {
    if (!isEditing) return
    inputRef.current?.select()

    // reselect to counter mouse movement
    const timeout = setTimeout(() => {
      inputRef.current?.select()
    }, 50)

    // reselect again to really make sure
    const timeout2 = setTimeout(() => {
      inputRef.current?.select()
    }, 400)

    return () => {
      clearTimeout(timeout)
      clearTimeout(timeout2)
    }
  }, [isEditing])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current?.contains(target)) return

      setEditMode('view')
      setHighlightedIndex(-1)
      setLocalUri(uri)
    }

    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [uri])

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

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const openEditor = useCallback(() => {
    setLocalUri(uri)
    setEditMode('edit')
    setHighlightedIndex(-1)
    focusInput()
  }, [focusInput, uri])

  const closeEditor = useCallback(
    (resetValue = true) => {
      setEditMode('view')
      setHighlightedIndex(-1)
      if (resetValue) setLocalUri(uri)
      inputRef.current?.blur()
    },
    [uri],
  )

  const goThere = async (e?: React.SyntheticEvent) => {
    e?.preventDefault()
    const nextUri = localUri.trim()
    if (!nextUri) {
      closeEditor()
      return
    }

    setEditMode('view')
    setHighlightedIndex(-1)
    inputRef.current?.blur()

    try {
      //  set uri
      setUri(nextUri)
      // refresh page ensures that states use this new uri
      browserLocation.reload()
    } catch (error) {
      console.error(error)
      setLocalUri(uri)
    } finally {
      setEditMode('view')
    }
  }

  const handleSelect = (result: GlobalSearchResult) => {
    setHighlightedIndex(-1)
    setEditMode('view')
    setLocalUri(result.uri)
    inputRef.current?.blur()
    setUri(result.uri)
    navigate(result.targetUrl)
  }

  const onCopy = () => {
    copyToClipboard(localUri)
  }

  const handleFocus = () => {
    if (editMode === 'view') {
      openEditor()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const nextTarget = e.relatedTarget as Node | null
    if (nextTarget && containerRef.current?.contains(nextTarget)) return
    closeEditor()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        if (!hasSearch || !results.length) return
        e.preventDefault()
        setHighlightedIndex((currentIndex) =>
          currentIndex < results.length - 1 ? currentIndex + 1 : 0,
        )
        break
      case 'ArrowUp':
        if (!hasSearch || !results.length) return
        e.preventDefault()
        setHighlightedIndex((currentIndex) =>
          currentIndex > 0 ? currentIndex - 1 : results.length - 1,
        )
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        closeEditor()
        break
      case 'Enter':
        if (hasSearch && results.length) {
          e.preventDefault()
          handleSelect(results[highlightedIndex >= 0 ? highlightedIndex : 0])
          break
        }
        goThere(e)
        break
    }
  }

  const uriDisplay = uri2crumbs(uri, location.pathname).join(' / ')
  const placeholder = canSearchProject ? 'Search this project or paste URI...' : 'Go to URI...'
  const inputValue = isEditing ? localUri : uriDisplay || placeholder

  return (
    <Styled.Wrapper ref={containerRef}>
      <Styled.Crumbtainer className={clsx({ editing: isEditing })}>
          <Styled.CrumbsForm
            $isSearchEnabled={canSearchProject}
            onSubmit={goThere}
            className={clsx({
              noUri: !isEditing && (!uriDisplay || !uri),
            editing: isEditing,
          })}
        >
          {(canSearchProject || (uriDisplay && localUri)) && (
            <Button
              icon={canSearchProject ? 'search' : 'edit'}
              aria-label={canSearchProject ? 'Search this project' : 'Edit URI'}
              style={{
                padding: isEditing ? 0 : '6px',
                opacity: isEditing ? 0 : 1,
                width: isEditing ? 0 : 'auto',
              }}
              onClick={(e) => {
                e.preventDefault()
                openEditor()
              }}
              variant="tonal"
            />
          )}
          <label data-value={inputValue || placeholder}>
            <InputText
              value={inputValue}
              onChange={(e) => setLocalUri(e.target.value)}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              placeholder={placeholder}
              aria-label={
                canSearchProject ? `Search within project ${projectName} or go to URI` : 'Go to URI'
              }
              aria-autocomplete={canSearchProject ? 'list' : undefined}
              aria-controls={showDropdown ? listId : undefined}
              aria-expanded={showDropdown}
              autoComplete="off"
              style={{ borderRadius: '4px 0 0 4px' }}
            />
          </label>
          <Button
            icon="arrow_forward"
            style={{
              display: isEditing ? 'inline-flex' : 'none',
              borderRadius: '0 4px 4px 0',
            }}
            onMouseDown={goThere}
            variant="tonal"
          />
          {showDropdown && (
            <SearchStyled.Dropdown id={listId} role="listbox">
              {results.map((result, index) => (
                <SearchStyled.ResultButton
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
                  <SearchStyled.ResultBody>
                    <SearchStyled.PrimaryText>{result.label || result.name}</SearchStyled.PrimaryText>
                    <SearchStyled.SecondaryText>{getContextLabel(result)}</SearchStyled.SecondaryText>
                  </SearchStyled.ResultBody>
                </SearchStyled.ResultButton>
              ))}

              {!results.length && (
                <SearchStyled.StatusRow>
                  {isLoading || isFetching ? 'Searching...' : 'No matches found'}
                </SearchStyled.StatusRow>
              )}
            </SearchStyled.Dropdown>
          )}
        </Styled.CrumbsForm>
        {uriDisplay && localUri && (
          <Button
            icon="content_copy"
            style={{ display: isEditing ? 'none' : 'inline-flex' }}
            onClick={onCopy}
            variant="tonal"
          />
        )}
      </Styled.Crumbtainer>
    </Styled.Wrapper>
  )
}

export default Breadcrumbs
