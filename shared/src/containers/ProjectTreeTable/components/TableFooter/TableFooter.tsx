import { CSSProperties } from 'react'
import { Column, Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'

import type { TableRow } from '../../types/table'
import { ProjectTableAttribute } from '../../types'
import { ROW_SELECTION_COLUMN_ID } from '../../context/SelectionCellsContext'
import * as Styled from './TableFooter.styled'
import { SummaryCell } from './SummaryCell'
import { classifyColumnSummary } from './classifyColumnSummary'
import { ColumnSummaryMap, SummaryCalc, RowScope, MainCountLabels } from './summaryTypes'

const DRAG_HANDLE_COLUMN_ID = 'drag-handle'

const pinningStyles = (column: Column<TableRow, unknown>): CSSProperties => {
  const isPinned = column.getIsPinned()
  const offset =
    column.id !== ROW_SELECTION_COLUMN_ID && column.id !== DRAG_HANDLE_COLUMN_ID ? -30 : 0
  return {
    left: isPinned === 'left' ? `${column.getStart('left') + offset}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 100 : 0,
  }
}

const columnWidth = (columnId: string) => `calc(var(--col-${columnId}-size) * 1px)`

interface TableFooterProps {
  columnVirtualizer: Virtualizer<HTMLDivElement, HTMLTableCellElement>
  table: Table<TableRow>
  virtualPaddingLeft: number | undefined
  virtualPaddingRight: number | undefined
  attribs: ProjectTableAttribute[]
  summaries: ColumnSummaryMap
  allScopeSummaries: ColumnSummaryMap
  calcByColumn: Record<string, SummaryCalc>
  onCalcChange: (columnId: string, calc: SummaryCalc) => void
  scopeByColumn: Record<string, RowScope>
  onScopeChange: (columnId: string, scope: RowScope) => void
  mainCountLabels?: MainCountLabels
}

export const TableFooter = ({
  columnVirtualizer,
  table,
  virtualPaddingLeft,
  virtualPaddingRight,
  attribs,
  summaries,
  allScopeSummaries,
  calcByColumn,
  onCalcChange,
  scopeByColumn,
  onScopeChange,
  mainCountLabels,
}: TableFooterProps) => {
  const visibleColumns = [
    ...table.getLeftVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getRightVisibleLeafColumns(),
  ]
  const virtualColumns = columnVirtualizer.getVirtualItems()

  return (
    <Styled.Footer>
      <Styled.FooterRow>
        {virtualPaddingLeft ? <td style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
        {virtualColumns.map((vc) => {
          const column = visibleColumns[vc.index]
          if (!column) return null

          const isUtility =
            column.id === DRAG_HANDLE_COLUMN_ID || column.id === ROW_SELECTION_COLUMN_ID
          const isLastPinnedLeft =
            column.getIsPinned() === 'left' && column.getIsLastColumn('left')

          return (
            <Styled.FooterCell
              key={column.id}
              className={clsx(column.id, { 'last-pinned-left': isLastPinnedLeft })}
              style={{ ...pinningStyles(column), width: columnWidth(column.id) }}
            >
              {!isUtility && (
                <SummaryCell
                  kind={classifyColumnSummary(column.id, attribs)}
                  summary={
                    scopeByColumn[column.id] === 'all'
                      ? allScopeSummaries[column.id] ?? summaries[column.id]
                      : summaries[column.id]
                  }
                  calc={calcByColumn[column.id]}
                  onCalcChange={(c) => onCalcChange(column.id, c)}
                  scope={scopeByColumn[column.id]}
                  onScopeChange={(s) => onScopeChange(column.id, s)}
                  mainCountLabels={mainCountLabels}
                />
              )}
            </Styled.FooterCell>
          )
        })}
        {virtualPaddingRight ? (
          <td style={{ display: 'flex', width: virtualPaddingRight }} />
        ) : null}
      </Styled.FooterRow>
    </Styled.Footer>
  )
}
