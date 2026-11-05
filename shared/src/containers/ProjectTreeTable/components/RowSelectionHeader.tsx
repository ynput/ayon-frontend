import React, { memo } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import { useSelectedRowsContext } from '../context/selected-rows'

const SelectionHeaderCell = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .icon {
    color: var(--md-sys-color-outline);
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);

    .icon {
      color: var(--md-sys-color-on-surface);
    }
  }

  &[data-selected='true'] .icon {
    color: var(--md-sys-color-on-surface);
  }
`

const RowSelectionHeader: React.FC = () => {
  const { areAllRowsSelected, areSomeRowsSelected, selectAllRows, clearRowsSelection } =
    useSelectedRowsContext()

  const allSelected = areAllRowsSelected()
  const someSelected = areSomeRowsSelected()

  const handleClick = () => {
    if (allSelected || someSelected) {
      // If all or some rows are selected, clear selection
      clearRowsSelection()
    } else {
      // Otherwise select all rows
      selectAllRows()
    }
  }

  return (
    <SelectionHeaderCell
      onClick={handleClick}
      data-selected={allSelected || someSelected}
      title={allSelected || someSelected ? 'Clear selection' : 'Select all rows'}
    >
      {/* Always visible so users can find it: dimmed when nothing is selected */}
      <Icon icon={someSelected && !allSelected ? 'remove' : 'done_all'} />
    </SelectionHeaderCell>
  )
}

export default memo(RowSelectionHeader)
