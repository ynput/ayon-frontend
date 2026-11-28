import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { useTableCellContext } from '../context/table-cell'

// Shows the row number like a spreadsheet; hovering the row swaps it for a checkbox so it's clear
// the cell selects the whole row
const StyledSelectionCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  /* This is super important as it prevents onMouseOver incorrectly firing when Icon is added/removed */
  pointer-events: none;
  height: 100%;
  width: 100%;
  user-select: none;

  .row-number {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-outline);
    overflow: hidden;
    white-space: nowrap;
  }

  .row-checkbox {
    display: none;
    font-size: 18px;
  }

  tr:hover & {
    .row-number {
      display: none;
    }
    .row-checkbox.unchecked {
      display: block;
      color: var(--md-sys-color-outline);
    }
  }

  td.selected & {
    .row-number,
    .row-checkbox.unchecked {
      display: none;
    }
    .row-checkbox.checked {
      display: block;
      color: var(--md-sys-color-primary);
    }
  }
`

export const SelectionCell = () => {
  const { rowNumber } = useTableCellContext()

  return (
    <StyledSelectionCell>
      {rowNumber !== undefined && <span className="row-number">{rowNumber}</span>}
      <Icon icon="check_box_outline_blank" className="row-checkbox unchecked" />
      <Icon icon="check_box" className="row-checkbox checked" />
    </StyledSelectionCell>
  )
}
