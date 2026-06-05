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

const EDITABLE_CELL_CLASS = 'editable'

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
  editable?: boolean
}

const renderTypedCellContent = <TData extends RowData>({
  cell,
  row,
  rowIndex,
  attributeData,
  dataTypeWidgets,
  editingState,
  callbacks,
  isReadOnly,
}: {
  cell: Cell<TData, unknown>
  row: Row<TData>
  rowIndex: number
  attributeData?: ListTableColumnAttributeData[string]
  dataTypeWidgets?: ListTableDataTypeWidgets<TData>
  editingState: ListTableCellEditingState
  callbacks: ListTableCellCallbacks<TData>
  isReadOnly: boolean
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
    isReadOnly,
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
  editable = true,
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
        const attributeType = attributeData?.type
        const shouldUseTypedWidget = !!attributeType && !hasCustomCellRenderer
        const hasTypedWidget = !!(attributeType && dataTypeWidgets?.[attributeType])
        const isEditing = editingState.editingCellId === cellId
        const isColumnEditable = editable && cell.column.columnDef.meta?.editable !== false
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
                isReadOnly: !isColumnEditable,
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

        const canStartTypedEdit =
          isColumnEditable && shouldUseTypedWidget && hasTypedWidget && !isPlaceholderRow
        if (canStartTypedEdit) {
          wrappedContent = (
            <Styled.EditableCellValue
              className={clsx(EDITABLE_CELL_CLASS, attributeType, { editing: isEditing })}
            >
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
              canStartTypedEdit
                ? (e) => {
                    e.stopPropagation()
                    editingState.startEditingCell(cellId)
                  }
                : undefined
            }
            onClick={(e) => {
              const target = e.target as HTMLElement
              // check if the click is within an editing cell
              if (isEditing && target.closest('.editing')) {
                e.stopPropagation() // prevent row click when interacting with the editing cell
              } else if (isColumnEditable) {
                // check if clicking an editable input or trigger element
                const editableElement = target.closest(`.${EDITABLE_CELL_CLASS}`)
                const triggerElement = target.closest(
                  `.${EDIT_TRIGGER_CLASS}, input, textarea, select, [contenteditable="true"]`,
                )
                if (editableElement || triggerElement) {
                  editingState.startEditingCell(cellId)
                  e.stopPropagation() // prevent row click when interacting with the editing cell
                }
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
