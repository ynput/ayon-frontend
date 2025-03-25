import React from 'react'
import { useSelection } from '../context/SelectionContext'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

const SelectionHeaderCell = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }
`

const RowSelectionHeader: React.FC = () => {
  const { areAllRowsSelected, areSomeRowsSelected, selectAllRows, clearRowsSelection } =
    useSelection()

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
    <SelectionHeaderCell onClick={handleClick}>
      {allSelected ? (
        // Show double check mark when all rows are selected
        <Icon icon="done_all" />
      ) : someSelected ? (
        // Show minimize icon when some (but not all) rows are selected
        <Icon icon="remove" />
      ) : // Show nothing when no rows are selected
      null}
    </SelectionHeaderCell>
  )
}

export default RowSelectionHeader
