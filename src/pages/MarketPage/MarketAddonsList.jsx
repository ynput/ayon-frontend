import React, { useEffect, useMemo, useRef, useState } from 'react'
import MarketAddonCard from '/src/components/MarketAddonCard/MarketAddonCard'
import styled from 'styled-components'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { InputText } from '@ynput/ayon-react-components'
import { Tag } from '/src/components/MarketAddonCard/MarketAddonCard.styled'

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

  .ps__rail-y {
    z-index: 100;
  }
`

const MarketAddonsList = ({
  addons = [],
  selected,
  onSelect,
  onHover,
  onDownload,
  isLoading,
  onUpdateAll,
  isUpdatingAll,
  isUpdatingAllFinished,
}) => {
  const [search, setSearch] = useState('')

  // filter addons by search
  const filteredAddons = useMemo(
    () =>
      addons.filter(
        (addon) =>
          addon.name?.toLowerCase().includes(search.toLowerCase()) ||
          addon.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [addons, search],
  )

  const listRef = useRef(null)
  const scrollRef = useRef(null)
  const [initialScreenFinish, setInitialScreenFinish] = useState(false)
  // when addons have finished loading, scroll to position of selected addon (from a redirect)
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
      <StyledList ref={scrollRef} containerRef={(el) => (listRef.current = el)}>
        {filteredAddons.map(({ name, orgTitle, ...props }) => {
          return (
            <MarketAddonCard
              id={name}
              key={name}
              author={orgTitle}
              onClick={() => onSelect(name)}
              isSelected={selected === name}
              onMouseOver={() => onHover(name)}
              onDownload={onDownload}
              name={name}
              {...props}
            />
          )
        })}
      </StyledList>
    </StyledAddonList>
  )
}

export default MarketAddonsList
