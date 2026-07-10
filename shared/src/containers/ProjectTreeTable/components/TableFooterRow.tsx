import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import { Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'
import { Button, Icon } from '@ynput/ayon-react-components'

import type { TableRow } from '../types/table'
import { ROW_SELECTION_COLUMN_ID } from '../constants'
import {
  DRAG_HANDLE_COLUMN_ID,
  getCommonPinningStyles,
  getColumnWidth,
} from '../utils/pinningUtils'
import { copyToClipboard } from '@shared/util'

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

const CellContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  width: 100%;
  height: 100%;
  padding: 0 8px;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);

  .label {
    color: var(--md-sys-color-outline);
  }
  .value {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
`

// Shimmer placeholder shown per cell while the footer stats are loading.
// Reuses the global `.loading.shimmer-dark` effect (loadingShimmer.scss) used
// by the table header/body.
const CellSkeleton = styled.div`
  width: calc(100% - 1px);
  height: calc(100% - 3px);
  margin-left: 1px;

  &.selection {
    width: calc(100% - 3px);
    margin-left: 1px;
  }
`

// Same shimmer, laid over the still-rendered (and still-clickable) cell content
// while only the stats are loading. pointer-events: none lets clicks fall
// through to the summary control underneath, so the footer never goes dead.
const CellSkeletonOverlay = styled(CellSkeleton)`
  position: absolute;
  inset: 1px 0 2px 1px;
  width: auto;
  height: auto;
  margin: 0;
  pointer-events: none;
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
  // full-cell skeleton while the summaries remote module itself is still loading
  isLoading?: boolean
  // stats still loading but the module is ready — keep cells clickable and show
  // a click-through shimmer over the (as yet empty) values
  statsLoading?: boolean
  // error fetching stats
  error?: any
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
  isLoading,
  statsLoading,
  error,
}) => {
  const visibleColumns = [
    ...table.getLeftVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getRightVisibleLeafColumns(),
  ]
  const virtualColumns = columnVirtualizer.getVirtualItems()

  const errorMessage =
    error instanceof Error ? error.message : typeof error === 'string' ? error : ''

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
          const isLastPinnedLeft = column.getIsPinned() === 'left' && column.getIsLastColumn('left')
          return (
            <FooterCell
              key={column.id}
              className={clsx(column.id, { 'last-pinned-left': isLastPinnedLeft })}
              style={{ ...getCommonPinningStyles(column), width: getColumnWidth(column.id) }}
            >
              {isLoading ? (
                <CellSkeleton
                  className={clsx('loading', 'shimmer-dark', {
                    selection: column.id === ROW_SELECTION_COLUMN_ID,
                  })}
                />
              ) : error ? (
                column.id === 'name' ? (
                  <CellContent style={{ color: 'var(--md-sys-color-error)' }}>
                    Error loading stats
                    <Icon
                      icon="info"
                      style={{ fontSize: 16, cursor: 'help' }}
                      data-tooltip={errorMessage}
                      data-tooltip-as="markdown"
                    />
                    <Button
                      icon="content_copy"
                      data-tooltip="Copy error message"
                      onClick={() => copyToClipboard(errorMessage)}
                      iconProps={{ style: { fontSize: 16 } }}
                      style={{ padding: 2 }}
                      variant="text"
                    />
                  </CellContent>
                ) : null
              ) : (
                !isUtility && (
                  <>
                    {renderCellContent?.(column.id)}
                    {statsLoading && (
                      <CellSkeletonOverlay className={clsx('loading', 'shimmer-dark')} />
                    )}
                  </>
                )
              )}
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
