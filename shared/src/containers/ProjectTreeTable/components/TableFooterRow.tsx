import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import { Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'

import type { TableRow } from '../types/table'
import { ROW_SELECTION_COLUMN_ID } from '../context/SelectionCellsContext'
import {
  DRAG_HANDLE_COLUMN_ID,
  getCommonPinningStyles,
  getColumnWidth,
} from '../utils/pinningUtils'

const Footer = styled.tfoot`
  display: grid !important;
  position: sticky;
  bottom: 0;
  z-index: 10;
  background-color: var(--md-sys-color-surface-container-lowest);
`

const FooterRowEl = styled.tr`
  display: flex;
  background-color: var(--md-sys-color-surface-container-low);

  &.clickable {
    cursor: pointer;
  }
`

const FooterCell = styled.td`
  position: relative;
  box-shadow: inset 1px 1px 0 0 var(--md-sys-color-surface-container);
  background-color: var(--md-sys-color-surface-container-lowest);
  display: flex;
  align-items: center;
  height: 34px !important;
  padding: 0 !important;
  overflow: visible;

  &.last-pinned-left {
    box-shadow: inset 1px 1px 0 0 var(--md-sys-color-surface-container),
      inset -2px 0 0 0 var(--md-sys-color-surface-container);
  }

  /* match the special fixed widths used by header/body cells */
  &.__row_selection__ {
    width: 20px !important;
    min-width: unset;
  }
  &.drag-handle {
    width: 24px !important;
    min-width: unset;
  }
`

export interface TableFooterRowProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TableRow>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  // cell content, provided by the powerpack summaries remote
  renderCellContent?: (columnId: string) => ReactNode
  // when set, the whole row is clickable (used for the locked/upsell state)
  onClick?: () => void
}

// Structural summary footer: the host owns the row, cell borders, widths and
// pinning; the powerpack remote only renders what's inside each cell.
export const TableFooterRow: FC<TableFooterRowProps> = ({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  renderCellContent,
  onClick,
}) => {
  const visibleColumns = [
    ...table.getLeftVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getRightVisibleLeafColumns(),
  ]
  const virtualColumns = columnVirtualizer.getVirtualItems()

  return (
    <Footer>
      <FooterRowEl
        className={clsx({ clickable: !!onClick })}
        onClick={onClick}
        data-tooltip={onClick ? 'Power feature' : undefined}
      >
        {virtualPaddingLeft ? <td style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
        {virtualColumns.map((vc) => {
          const column = visibleColumns[vc.index]
          if (!column) return null
          const isUtility =
            column.id === DRAG_HANDLE_COLUMN_ID || column.id === ROW_SELECTION_COLUMN_ID
          const isLastPinnedLeft =
            column.getIsPinned() === 'left' && column.getIsLastColumn('left')
          return (
            <FooterCell
              key={column.id}
              className={clsx(column.id, { 'last-pinned-left': isLastPinnedLeft })}
              style={{ ...getCommonPinningStyles(column), width: getColumnWidth(column.id) }}
            >
              {!isUtility && renderCellContent?.(column.id)}
            </FooterCell>
          )
        })}
        {virtualPaddingRight ? (
          <td style={{ display: 'flex', width: virtualPaddingRight }} />
        ) : null}
      </FooterRowEl>
    </Footer>
  )
}
