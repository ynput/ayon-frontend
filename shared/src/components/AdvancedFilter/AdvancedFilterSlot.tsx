import { FC, MouseEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Button, Icon, type SearchFilterRef } from '@ynput/ayon-react-components'
import type { QueryFilter } from '@shared/containers/ProjectTreeTable/types/operations'
import {
  AdvancedFilterField,
  countAdvancedFilterRules,
} from '@shared/containers/ProjectTreeTable/utils/advancedFilter'
import { ADVANCED_FILTER_LABEL, ADVANCED_FILTER_MAX_DEPTH } from './AdvancedFilterSlotHelpers'
import type { AdvancedFilterEditor } from './useAdvancedFilterEditor'
import { useSearchBarSlot } from './useSearchBarSlot'
import * as Styled from './AdvancedFilterSlot.styled'

export interface AdvancedFilterSlotProps {
  searchFilterRef: RefObject<SearchFilterRef>
  value?: QueryFilter
  onChange: (value: QueryFilter | undefined) => void
  // from useAdvancedFilterInSearchBar
  editor: AdvancedFilterEditor
  fields: AdvancedFilterField[]
  // opens the editor each time it changes
  openRequest?: number
  disabled?: boolean
}

// Only clicks on the chip itself: the editor's panel and its dropdowns are rendered elsewhere in
// the page but are React children of the chip, and the dropdowns need their mouse events to reach
// the document (that is where a multi-select dropdown takes its picked values).
const stopOnChip = (e: MouseEvent) => {
  if (e.currentTarget.contains(e.target as Node)) e.stopPropagation()
}

// The advanced filter inside the search bar, at its end after the chips and the text, next to the
// filter button: a chip that opens the editor (the
// Power Pack module `AdvancedFilter`), shown while the filter has rules or is being edited.
// Without the module a stored filter still applies: its chip can only be removed.
export const AdvancedFilterSlot: FC<AdvancedFilterSlotProps> = ({
  searchFilterRef,
  value,
  onChange,
  editor: { Editor },
  fields,
  openRequest,
  disabled,
}) => {
  const slot = useSearchBarSlot(searchFilterRef)
  if (!slot) return null

  let content = null
  if (Editor) {
    content = (
      <Editor
        appearance="pill"
        value={value}
        onChange={onChange}
        fields={fields}
        disabled={disabled}
        maxDepth={ADVANCED_FILTER_MAX_DEPTH}
        openRequest={openRequest}
      />
    )
  } else if (value) {
    content = (
      <Styled.Chip data-tooltip="This filter is applied. It can only be removed here.">
        <Icon icon="filter_alt" />
        {ADVANCED_FILTER_LABEL}
        <span className="count">{countAdvancedFilterRules(value)}</span>
        <Button
          className="remove"
          icon="close"
          variant="text"
          data-tooltip="Remove advanced filter"
          disabled={disabled}
          onClick={() => onChange(undefined)}
        />
      </Styled.Chip>
    )
  }
  if (!content) return null

  return createPortal(
    // the search bar opens its dropdown on a click
    <Styled.SlotContent onMouseDown={stopOnChip} onClick={stopOnChip}>
      {content}
    </Styled.SlotContent>,
    slot,
  )
}
