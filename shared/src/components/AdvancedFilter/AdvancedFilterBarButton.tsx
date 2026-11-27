import { FC, MouseEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type SearchFilterRef } from '@ynput/ayon-react-components'
import { usePowerpack } from '@shared/context'
import { ADVANCED_FILTER_LABEL } from './AdvancedFilterSlotHelpers'
import type { AdvancedFilterEditor } from './useAdvancedFilterEditor'
import { useSearchBarSlot } from './useSearchBarSlot'
import * as Styled from './AdvancedFilterSlot.styled'

export interface AdvancedFilterBarButtonProps {
  searchFilterRef: RefObject<SearchFilterRef>
  editor: AdvancedFilterEditor
  // useAdvancedFilterInSearchBar: movableCount, moveToAdvancedFilter and open
  movableCount: number
  onMove: () => void
  onOpen: () => void
}

const stop = (e: MouseEvent) => e.stopPropagation()

// The filter button at the right end of a search bar. With filters in the bar it converts them
// into an advanced filter (text searches stay); without, it opens the advanced filter.
export const AdvancedFilterBarButton: FC<AdvancedFilterBarButtonProps> = ({
  searchFilterRef,
  editor: { Editor, powerLicense, isLoading, outdated },
  movableCount,
  onMove,
  onOpen,
}) => {
  const slot = useSearchBarSlot(searchFilterRef)
  const { setPowerpackDialog } = usePowerpack()
  if (!slot || isLoading) return null

  let label = ADVANCED_FILTER_LABEL
  let tooltip: string
  let onClick: (() => void) | undefined
  if (Editor && movableCount) {
    label = 'Convert filters'
    tooltip = 'Convert these filters into an advanced filter. Text searches stay here.'
    onClick = onMove
  } else if (Editor) {
    tooltip = 'Advanced filter: conditions in And / Or groups'
    onClick = onOpen
  } else if (!powerLicense) {
    tooltip = ADVANCED_FILTER_LABEL
    onClick = () => setPowerpackDialog('advancedFilters')
  } else {
    tooltip = outdated
      ? `Update the Power Pack to ${outdated.required} or newer to use the advanced filter.`
      : 'The advanced filter is not available.'
  }

  return createPortal(
    <Styled.BarButton
      variant="text"
      aria-label={label}
      data-tooltip={tooltip}
      disabled={!onClick}
      // the search bar opens its dropdown on a click
      onMouseDown={stop}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <Icon icon="filter_alt" />
      {!powerLicense && <Icon icon="bolt" className="bolt" />}
    </Styled.BarButton>,
    slot,
  )
}
