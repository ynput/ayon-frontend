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
    font-size: 18px;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);

    .icon {
      color: var(--md-sys-color-on-surface);
    }
  }

  &[data-selected='true'] .icon {
    color: var(--md-sys-color-primary);
  }
`

const RowSelectionHeader: React.FC = () => {
  const { areAllRowsSelected, areSomeRowsSelected, selectAllRows, clearRowsSelection } =
    useSelectedRowsContext()

  const allSelected = areAllRowsSelected()
  const someSelected = areSomeRowsSelected()

  const anySelected = allSelected || someSelected

  return (
    <SelectionHeaderCell
      // with any row selected it clears the selection, otherwise it selects all rows
      onClick={anySelected ? clearRowsSelection : selectAllRows}
      data-selected={anySelected}
      title={anySelected ? 'Clear selection' : 'Select all rows'}
    >
      <Icon icon={anySelected ? 'indeterminate_check_box' : 'check_box_outline_blank'} />
    </SelectionHeaderCell>
  )
}

export default memo(RowSelectionHeader)
