import { FC, useState, useMemo, useRef, useEffect, Fragment } from 'react'
import * as Styled from './LinksManager.styled'
import { Icon } from '@ynput/ayon-react-components'
import { useGetSearchedEntitiesLinksInfiniteQuery } from '@shared/api'
import useKeyboardNavigation from './hooks/useKeyboardNavigation'
import SearchingLoadingItems from './SearchingLoadingItems'
import { useProjectContext } from '@shared/context'
import { getEntityIcon, getEntityColor } from '@shared/containers'

export type LinkSearchType = 'search' | 'picker' | null

interface AddNewLinksProps {
  targetEntityType: string
  projectName: string
  onClose?: () => void
  onSearchTypeChange: (type: LinkSearchType) => void //  used to handle search type changes
  onAdd?: (targetEntityId: string, linkType?: string) => void
}

const AddNewLinks: FC<AddNewLinksProps> = ({
  projectName,
  targetEntityType,
  onClose,
  onSearchTypeChange,
  onAdd,
}) => {
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const project = useProjectContext()

  const anatomyForIcons = {
    folderTypes: project?.folderTypes || [],
    taskTypes: project?.taskTypes || [],
    productTypes: project?.productTypes || [],
  }

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
      <Styled.SubHeader>Add new link</Styled.SubHeader>
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
            label={`Pick ${targetEntityType}s`}
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
                  <Icon
                    icon={getEntityIcon(entity.entityType, entity.subType, anatomyForIcons)}
                    style={{
                      color: getEntityColor(entity.entityType, entity.subType, anatomyForIcons) || undefined
                    }}
                  />
                  <span className="label">
                    {entity.parents?.map((part, index) => (
                      <Fragment key={index}>
                        <span key={index + '-path'}>{part}</span>
                        <span key={index + '-separator'}>/</span>
                      </Fragment>
                    ))}
                    <strong>{entity.label || entity.name}</strong>
                  </span>
                  <span className="type">{entity.subType || entity.entityType}</span>
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
