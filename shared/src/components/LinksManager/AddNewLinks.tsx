import { FC, useState, useMemo, useRef, useEffect } from 'react'
import * as Styled from './LinksManager.styled'
import { Button, Icon } from '@ynput/ayon-react-components'
import { useGetSearchedEntitiesLinksInfiniteQuery } from '@shared/api'
import { getEntityTypeIcon } from '@shared/util'
import useKeyboardNavigation from './hooks/useKeyboardNavigation'
import SearchingLoadingItems from './SearchingLoadingItems'
import { upperFirst } from 'lodash'

export type LinkSearchType = 'search' | 'picker' | null

interface AddNewLinksProps {
  targetEntityType: string
  projectName: string
  onClose?: () => void
  searchType: LinkSearchType //  used to determine if the search is active
  onSearchTypeChange: (type: LinkSearchType) => void //  used to handle search type changes
  onAdd?: (targetEntityId: string, linkType?: string) => void
}

const AddNewLinks: FC<AddNewLinksProps> = ({
  projectName,
  targetEntityType,
  onClose,
  searchType,
  onSearchTypeChange,
  onAdd,
}) => {
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const {
    data: searchData,
    error,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetSearchedEntitiesLinksInfiniteQuery(
    {
      projectName,
      entityType: targetEntityType,
      search,
    },
    { skip: !search },
  )

  // Flatten all entities from all pages
  const entities = useMemo(() => {
    return searchData?.pages.flatMap((page) => page.entities) || []
  }, [searchData])

  const handleSelectEntity = (entity: any) => {
    console.log(`Add ${entity.name}`)
    onAdd?.(entity.id)
    // Clear search after adding
    setSearch('')
  }

  const handleClose = () => {
    onClose?.()
  }

  const { containerRef, getItemProps } = useKeyboardNavigation({
    entities,
    onSelect: handleSelectEntity,
    onClose: handleClose,
    isActive: Boolean(search && entities.length > 0),
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  // Force focus the search input on mount and when searchData or search changes
  useEffect(() => {
    // Use setTimeout to ensure focus after render
    const timeout = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 0)
    return () => clearTimeout(timeout)
  }, [searchData, search])

  return (
    <Styled.AddLinksContainer>
      <Styled.Header>Add new link</Styled.Header>
      <Styled.SearchButtons>
        <Styled.Search>
          <Icon icon={'search'} className="input-search" />
          <Styled.SearchInput
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${targetEntityType}s...`}
            id={`search-${targetEntityType}`}
            autoFocus
            autoComplete="off"
          />
        </Styled.Search>

        {!search && (
          <Styled.PickerButton
            label={`${upperFirst(targetEntityType)} Picker`}
            icon="table_rows"
            onClick={() => onSearchTypeChange('picker')}
          />
        )}
      </Styled.SearchButtons>

      {search && searchData && (
        <Styled.SearchItems ref={containerRef}>
          {searchData?.pages.map((page, pageIndex) =>
            page.entities.map((entity, entityIndex) => {
              const flatIndex =
                searchData.pages
                  .slice(0, pageIndex)
                  .reduce((acc, p) => acc + p.entities.length, 0) + entityIndex
              return (
                <Styled.SearchItem
                  key={entity.id}
                  onClick={() => handleSelectEntity(entity)}
                  tabIndex={0}
                  {...getItemProps(flatIndex)}
                >
                  <Icon icon={getEntityTypeIcon(entity.entityType)} />
                  <span className="label">
                    {entity.path
                      .slice(1, entity.path.length) // Remove leading slash
                      .split('/')
                      .flatMap((p) => [p, '/'])
                      .map((part, index) => (
                        <span key={index}>{part}</span>
                      ))}
                    <strong>{entity.label || entity.name}</strong>
                  </span>
                  <span className="type">
                    {entity.folderType ||
                      entity.taskType ||
                      entity.productType ||
                      entity.entityType}
                  </span>
                </Styled.SearchItem>
              )
            }),
          )}
          {(isLoading || isFetchingNextPage || hasNextPage) && <SearchingLoadingItems />}
        </Styled.SearchItems>
      )}
      {!isLoading && error && <Styled.Error>{error.message}</Styled.Error>}
    </Styled.AddLinksContainer>
  )
}

export default AddNewLinks
