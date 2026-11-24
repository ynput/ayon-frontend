import { FC, RefObject, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type SearchFilterRef } from '@ynput/ayon-react-components'
import * as Styled from './AdvancedFilterSlot.styled'

export interface AdvancedFilterMoveButtonProps {
  searchFilterRef: RefObject<SearchFilterRef>
  // useAdvancedFilterInSearchBar: movableCount and moveToAdvancedFilter
  count: number
  onMove: () => void
}

// Inside the search bar, at its right end: moves its filters into the advanced filter, text
// searches stay. Shown while there is something to move.
export const AdvancedFilterMoveButton: FC<AdvancedFilterMoveButtonProps> = ({
  searchFilterRef,
  count,
  onMove,
}) => {
  const [searchBar, setSearchBar] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setSearchBar(searchFilterRef.current?.getFiltersBarElement() ?? null)
  }, [searchFilterRef])

  if (!searchBar || !count) return null
  return createPortal(
    // the filter icon with an arrow towards the Advanced filter button next to the search bar
    <Styled.MoveButton
      variant="text"
      aria-label="Convert filters"
      data-tooltip="Convert filters: move them into the advanced filter. Text searches stay here."
      // the search bar opens its dropdown on a click
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onMove()
      }}
    >
      <Icon icon="filter_alt" />
      <Icon icon="arrow_forward" className="arrow" />
    </Styled.MoveButton>,
    searchBar,
  )
}
