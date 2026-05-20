import React from 'react'
import { Cell, flexRender, Row, RowData } from '@tanstack/react-table'
import * as Styled from './ListTable.styled'
import {
  getListTableCellId,
  ListTableColumnAttributeData,
  ListTableDataTypeWidgets,
  ListTableWidgetRenderContext,
  renderListTableFallbackValue,
} from './ListTableWidgets'
import clsx from 'clsx'
import { EDIT_TRIGGER_CLASS } from '../ProjectTreeTable'

const isPlaceholderRowValue = (value: unknown): value is { __listTablePlaceholder: true } =>
  !!value && typeof value === 'object' && '__listTablePlaceholder' in (value as object)

// 1. Refactored Type: Pass 'content' to the function so it can wrap it naturally
export type CellWrapperRenderer<TData extends RowData> =
  | ((row: Row<TData>, content: React.ReactNode) => React.ReactElement | null)
  | null

export interface ListTableCellEditingState {
  editingCellId: string | null
  startEditingCell: (cellId: string) => void
  stopEditingCell: () => void
  getDraftValue: () => string | null
  setDraftValue: (value: string | null) => void
}

export interface ListTableCellCallbacks<TData extends RowData> {
  onUpdateRow: (columnId: string, value: unknown, rowId: string) => void
  onOpenViewer?: (row: TData) => void
}

interface RowCellsProps<TData extends RowData> {
  row: Row<TData>
  cellWrapper?: CellWrapperRenderer<TData>
  columnAttributeData?: ListTableColumnAttributeData
  dataTypeWidgets?: ListTableDataTypeWidgets<TData>
  editingState: ListTableCellEditingState
  callbacks: ListTableCellCallbacks<TData>
}

const renderTypedCellContent = <TData extends RowData>({
  cell,
  row,
  rowIndex,
  attributeData,
  dataTypeWidgets,
  editingState,
  callbacks,
}: {
  cell: Cell<TData, unknown>
  row: Row<TData>
  rowIndex: number
  attributeData?: ListTableColumnAttributeData[string]
  dataTypeWidgets?: ListTableDataTypeWidgets<TData>
  editingState: ListTableCellEditingState
  callbacks: ListTableCellCallbacks<TData>
}) => {
  const attributeType = attributeData?.type
  if (!attributeType || !dataTypeWidgets?.[attributeType]) {
    return null
  }

  const renderer = dataTypeWidgets[attributeType]
  if (!renderer) {
    return null
  }

  const columnId = cell.column.id
  const cellId = getListTableCellId(row.id, columnId)
  const context: ListTableWidgetRenderContext<TData> = {
    row,
    cell,
    value: cell.getValue(),
    rowIndex,
    columnId,
    cellId,
    attributeData,
    isEditing: editingState.editingCellId === cellId,
    startEditing: () => editingState.startEditingCell(cellId),
    stopEditing: editingState.stopEditingCell,
    updateValue: (value) => {
      callbacks.onUpdateRow(columnId, value, row.id)
      editingState.stopEditingCell()
    },
    openViewer: () => callbacks.onOpenViewer?.(row.original),
    getDraftValue: editingState.getDraftValue,
    setDraftValue: editingState.setDraftValue,
  }

  return renderer(context)
}

export const RowCells = <TData extends RowData>({
  row,
  cellWrapper,
  columnAttributeData,
  dataTypeWidgets,
  editingState,
  callbacks,
}: RowCellsProps<TData>) => {
  const isPlaceholderRow = isPlaceholderRowValue(row.original)

  if (isPlaceholderRow) {
    const message =
      row.original && typeof row.original === 'object' && 'label' in row.original
        ? String((row.original as { label?: string }).label ?? '')
        : ''

    return (
      <Styled.TD key={`${row.id}-placeholder`} style={{ width: '100%' }}>
        <Styled.TDInner
          style={{ left: 0, paddingLeft: `calc(var(--padding-m) + ${row.depth * 16}px)` }}
        >
          <Styled.PlaceholderRowContent>{message}</Styled.PlaceholderRowContent>
        </Styled.TDInner>
      </Styled.TD>
    )
  }

  return (
    <>
      {row.getVisibleCells().map((cell, cellIndex, visibleCells) => {
        const cellId = getListTableCellId(row.id, cell.column.id)
        const attributeData = columnAttributeData?.[cell.column.id]
        const hasCustomCellRenderer = !!cell.column.columnDef.meta?.listTableCustomCell
        const shouldUseTypedWidget = !!attributeData?.type && !hasCustomCellRenderer
        const hasTypedWidget = !!(attributeData?.type && dataTypeWidgets?.[attributeData.type])
        const isEditing = editingState.editingCellId === cellId
        const typedContent =
          !shouldUseTypedWidget || isPlaceholderRow
            ? null
            : renderTypedCellContent({
                cell,
                row,
                rowIndex: row.index,
                attributeData,
                dataTypeWidgets,
                editingState,
                callbacks,
              })

        const content =
          !shouldUseTypedWidget || isPlaceholderRow
            ? flexRender(cell.column.columnDef.cell, cell.getContext())
            : typedContent ?? renderListTableFallbackValue(cell.getValue())
        let wrappedContent: React.ReactNode = content

        if (cellWrapper !== null) {
          if (cellWrapper) {
            wrappedContent = cellWrapper(row, content) || content
          } else {
            wrappedContent = <Styled.ListTableCellWrapper>{content}</Styled.ListTableCellWrapper>
          }
        }

        const canStartTypedEdit = shouldUseTypedWidget && hasTypedWidget && !isPlaceholderRow
        if (canStartTypedEdit) {
          wrappedContent = (
            <Styled.EditableCellValue className={clsx({ editing: isEditing })}>
              {wrappedContent}
            </Styled.EditableCellValue>
          )
        }

        return (
          <Styled.TD
            key={cell.id}
            id={cellId}
            style={{
              width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
              paddingRight: cellIndex === visibleCells.length - 1 ? 'var(--padding-m)' : undefined,
            }}
            onDoubleClick={
              canStartTypedEdit ? () => editingState.startEditingCell(cellId) : undefined
            }
            onClick={(e) => {
              const target = e.target as HTMLElement
              // check for trigger elements like the dropdown
              if (target.closest(`.${EDIT_TRIGGER_CLASS}`)) {
                if (!isEditing) {
                  editingState.startEditingCell(cellId)
                }
              }
              // check if the click is within an editing cell
              if (isEditing && target.closest('.editing')) {
                e.stopPropagation() // prevent row click when interacting with the editing cell
              }
            }}
          >
            <Styled.TDInner
              className="inner-td"
              style={{
                left: cellIndex === 0 ? `calc(var(--padding-m) + ${row.depth * 16}px)` : undefined,
              }}
            >
              {wrappedContent}
            </Styled.TDInner>
          </Styled.TD>
        )
      })}
    </>
  )
}
