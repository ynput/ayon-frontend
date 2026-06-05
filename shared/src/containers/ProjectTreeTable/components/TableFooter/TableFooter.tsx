import { Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import clsx from 'clsx'

import type { TableRow } from '../../types/table'
import { BuiltInFieldOptions, ProjectTableAttribute } from '../../types'
import { ROW_SELECTION_COLUMN_ID } from '../../context/SelectionCellsContext'
import {
  DRAG_HANDLE_COLUMN_ID,
  getCommonPinningStyles,
  getColumnWidth,
} from '../../utils/pinningUtils'
import * as Styled from './TableFooter.styled'
import { SummaryCell } from './SummaryCell'
import { classifyColumnSummary } from './classifyColumnSummary'
import {
  ColumnSummary,
  ColumnSummaryMap,
  SummaryCalc,
  RowScope,
  MainCountLabels,
} from './summaryTypes'

type OptionLike = { value?: unknown; label?: string | null; color?: string | null; icon?: string | null }

// Backend distribution carries raw values + counts only; labels/colors/icons
// come from project anatomy (status/type/tag/assignee options) or attrib enums.
const enrichDistribution = (
  columnId: string,
  summary: ColumnSummary | undefined,
  fieldOptions: BuiltInFieldOptions | undefined,
  attribs: ProjectTableAttribute[],
): ColumnSummary | undefined => {
  if (!summary?.distribution?.length) return summary

  let options: OptionLike[] | undefined
  if (columnId === 'status') options = fieldOptions?.status
  else if (columnId === 'subType')
    options = [
      ...(fieldOptions?.folderType ?? []),
      ...(fieldOptions?.taskType ?? []),
      ...(fieldOptions?.productType ?? []),
    ]
  else if (columnId === 'assignees') options = fieldOptions?.assignee
  else if (columnId === 'tags') options = fieldOptions?.tag
  else if (columnId.startsWith('attrib_'))
    options = attribs.find((a) => a.name === columnId.slice('attrib_'.length))?.data?.enum

  if (!options?.length) return summary

  const byValue = new Map(options.map((o) => [String(o.value), o]))
  return {
    ...summary,
    distribution: summary.distribution.map((d) => {
      const option = byValue.get(d.value)
      if (!option) return d
      return {
        ...d,
        label: d.label ?? option.label ?? undefined,
        color: d.color ?? option.color ?? undefined,
        icon: d.icon ?? option.icon ?? undefined,
      }
    }),
  }
}

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
  fieldOptions?: BuiltInFieldOptions
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
  fieldOptions,
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
              style={{ ...getCommonPinningStyles(column), width: getColumnWidth(column.id) }}
            >
              {!isUtility && (
                <SummaryCell
                  kind={classifyColumnSummary(column.id, attribs)}
                  summary={enrichDistribution(
                    column.id,
                    scopeByColumn[column.id] === 'all'
                      ? allScopeSummaries[column.id] ?? summaries[column.id]
                      : summaries[column.id],
                    fieldOptions,
                    attribs,
                  )}
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
