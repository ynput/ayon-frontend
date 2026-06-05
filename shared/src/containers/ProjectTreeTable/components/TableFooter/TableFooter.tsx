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
import { classifyColumnSummary, isAlwaysFilledColumn } from './classifyColumnSummary'
import {
  ColumnSummary,
  ColumnSummaryMap,
  DEFAULT_ROW_SCOPE,
  SummaryCalc,
  SummaryFormat,
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
  groupScopeSummaries: ColumnSummaryMap
  calcByColumn: Record<string, SummaryCalc>
  onCalcChange: (columnId: string, calc: SummaryCalc) => void
  formatByColumn: Record<string, SummaryFormat>
  onFormatChange: (columnId: string, format: SummaryFormat) => void
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
  groupScopeSummaries,
  calcByColumn,
  onCalcChange,
  formatByColumn,
  onFormatChange,
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

          const kind = classifyColumnSummary(column.id, attribs)
          const scope = scopeByColumn[column.id] ?? DEFAULT_ROW_SCOPE

          // main cell carries its own primary/secondary counts; other cells follow scope
          const pickSummary = (): ColumnSummary | undefined => {
            if (kind === 'main') return summaries[column.id]
            let scoped: ColumnSummary | undefined
            if (scope === 'all') scoped = allScopeSummaries[column.id] ?? summaries[column.id]
            else if (scope === 'tasks') scoped = summaries[column.id]
            else if (scope === 'folders') scoped = groupScopeSummaries[column.id]
            if (scoped) return scoped
            // empty shell keeps the cell clickable so the scope toggles stay reachable
            const fallback =
              summaries[column.id] ??
              allScopeSummaries[column.id] ??
              groupScopeSummaries[column.id]
            return fallback ? { columnId: column.id } : undefined
          }

          return (
            <Styled.FooterCell
              key={column.id}
              className={clsx(column.id, { 'last-pinned-left': isLastPinnedLeft })}
              style={{ ...getCommonPinningStyles(column), width: getColumnWidth(column.id) }}
            >
              {!isUtility && (
                <SummaryCell
                  kind={kind}
                  summary={enrichDistribution(column.id, pickSummary(), fieldOptions, attribs)}
                  calc={calcByColumn[column.id]}
                  onCalcChange={(c) => onCalcChange(column.id, c)}
                  format={formatByColumn[column.id]}
                  onFormatChange={(f) => onFormatChange(column.id, f)}
                  scope={scope}
                  onScopeChange={(s) => onScopeChange(column.id, s)}
                  mainCountLabels={mainCountLabels}
                  allowFillMode={!isAlwaysFilledColumn(column.id)}
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
