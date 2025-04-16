import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import MarketAddonCard, { MarketAddonCardGroup } from '@components/MarketAddonCard'
import styled from 'styled-components'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { InputText } from '@ynput/ayon-react-components'
import { Tag } from '@components/MarketAddonCard/MarketAddonCard.styled'
import { MarketAddonItem } from '@queries/market/getMarket'
import { ListItemType } from '@components/MarketAddonCard/MarketAddonCard'
import EmptyPlaceholder from '@shared/EmptyPlaceholder/EmptyPlaceholder'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useExpandedGroups } from './hooks'

const StyledAddonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  height: 100%;
  min-width: 400px;
  max-width: 800px;
  overflow: hidden;
  flex: 1;

  .search {
    padding: 2px;

    width: 100%;
    display: flex;
    gap: var(--base-gap-large);

    button {
      height: unset;
      width: 120px;
      padding-right: 12px;
      border-radius: var(--border-radius-m);
      background-color: var(--md-sys-color-surface-container-high) !important;
    }
  }
`

const StyledInput = styled(InputText)`
  max-height: 40px;
  height: 40px;
  flex: 1;
`

const StyledList = styled(PerfectScrollbar)`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
  width: unset;
  border-radius: var(--border-radius-m);
  padding-bottom: 100px;
  background-color: var(--md-sys-color-surface-container-low);
  padding: var(--padding-s);
  gap: var(--base-gap-small);

  .ps__rail-y {
    z-index: 100;
  }
`

interface ExtendedMarketAddonItem extends MarketAddonItem {
  subTitle?: string
  isPlaceholder?: boolean
  isWaiting?: boolean
  isDownloading?: boolean
  isFailed?: boolean
  isFinished?: boolean
  isActive?: boolean
  flags?: string[]
}

export type MarketListItem = {
  type: ListItemType
  items: ExtendedMarketAddonItem[]
  group?: {
    id: string
    title: string
    isOfficial: boolean
    isVerified: boolean
    author?: string
    createdAt?: string
  }
}

type MarketAddonListProps = {
  items: MarketListItem[]
  selected: string
  filter: string
  onSelect: (name: string, type: ListItemType) => void
  onHover: (name: string, type: ListItemType) => void
  onDownload: (type: ListItemType, name: string, version?: string) => void
  isLoading: boolean
  error?: FetchBaseQueryError
  onUpdateAll?: () => void
  isUpdatingAll?: boolean
  isUpdatingAllFinished?: boolean
}

const MarketAddonsList = ({
  items = [],
  selected,
  filter,
  onSelect,
  onHover,
  onDownload,
  isLoading,
  error,
  onUpdateAll,
  isUpdatingAll,
  isUpdatingAllFinished,
}: MarketAddonListProps) => {
  const { expandedGroups, setExpandedGroups } = useExpandedGroups({
    items,
    selected,
    filter,
  })
  const [search, setSearch] = useState('')

  // filter items by search
  const filteredItems = useMemo(
    () =>
      items.filter(
        (addon) =>
          addon.group?.title.toLowerCase().includes(search.toLowerCase()) ||
          addon.items?.some((item) => item.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [items, search],
  )

  const listRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<PerfectScrollbar | null>(null)
  const [initialScreenFinish, setInitialScreenFinish] = useState(false)
  // when items have finished loading, scroll to position of selected addon (from a redirect)
  useEffect(() => {
    if (listRef.current && selected && !isLoading && !initialScreenFinish) {
      const scrollContainer = listRef.current.querySelector('.scrollbar-container')

      if (scrollContainer) {
        const el = scrollContainer.querySelector(`[id="${selected}"]`)
        // get top of element in scroll container
        if (el) {
          const top = el.getBoundingClientRect().top
          scrollContainer.scrollTo({ top: top - 200 })
        }
      }
    }

    if (!isLoading && !initialScreenFinish) setInitialScreenFinish(true)
  }, [isLoading, selected, initialScreenFinish, listRef.current])

  const showChildItems = (groupId?: string) => {
    return !groupId || expandedGroups.includes(groupId)
  }

  const handleToggleGroup = (id: string) => {
    setExpandedGroups(id, filter)
  }

  if (error) {
    return (
      <EmptyPlaceholder
        error={
          // @ts-ignore
          error?.data?.detail || JSON.stringify(error)
        }
        style={{ position: 'relative', left: 0, top: '-10%', transform: 'unset', flex: 1 }}
      />
    )
  }

  return (
    <StyledAddonList ref={listRef}>
      <div className="search">
        <StyledInput
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {onUpdateAll && (
          <Tag
            icon={isUpdatingAll ? 'sync' : isUpdatingAllFinished ? 'check_circle' : 'upgrade'}
            onClick={onUpdateAll}
            className={isUpdatingAll ? 'downloading' : ''}
            disabled={isUpdatingAll || isUpdatingAllFinished}
          >
            {isUpdatingAll ? 'Updating...' : isUpdatingAllFinished ? 'All Updated' : 'Update All'}
          </Tag>
        )}
      </div>
      <StyledList ref={scrollRef} containerRef={(el) => (listRef.current = el as HTMLDivElement)}>
        {filteredItems.flatMap(({ group, items, type }) => {
          const listItems: ReactNode[] = []

          // show group header if there is one
          if (group) {
            listItems.push(
              <MarketAddonCardGroup
                key={group.id}
                title={group.title}
                author={group.author}
                createdAt={group.createdAt}
                isOfficial={group.isOfficial}
                isVerified={group.isVerified}
                isExpanded={expandedGroups.includes(group.id)}
                isPlaceholder={isLoading}
                onClick={() => handleToggleGroup(group.id)}
              />,
            )
          }

          // show items if group is expanded or no group
          if (showChildItems(group?.id)) {
            items.forEach(
              ({
                subTitle,
                title,
                name,
                latestVersion,
                icon,
                available,
                flags,
                isOfficial,
                isVerified,
                isDownloaded,
                isOutdated,
                isPlaceholder,
                isWaiting, // waiting to be downloaded/updated by update all
                isDownloading,
                isFailed,
                isFinished,
                isActive,
              }) => {
                listItems.push(
                  <MarketAddonCard
                    id={name}
                    type={type}
                    key={name}
                    author={subTitle}
                    onClick={() => onSelect(name, type)}
                    isSelected={selected === name}
                    onMouseOver={() => onHover(name, type)}
                    onDownload={(n, v) => onDownload(type, n, v)}
                    style={{ paddingLeft: group ? 40 : 4 }}
                    isActive={isActive || type === 'addon'}
                    flags={flags}
                    {...{
                      title,
                      name,
                      latestVersion,
                      icon,
                      isOfficial,
                      isVerified,
                      isDownloaded,
                      isOutdated,
                      isPlaceholder,
                      isWaiting,
                      isDownloading,
                      isFailed,
                      isFinished,
                      available,
                    }}
                  />,
                )
              },
            )
          }

          return listItems
        })}
      </StyledList>
    </StyledAddonList>
  )
}

export default MarketAddonsList
