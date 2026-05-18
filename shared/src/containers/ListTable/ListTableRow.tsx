import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Row, RowData } from '@tanstack/react-table'
import clsx from 'clsx'
import * as Styled from './ListTable.styled'
import {
  CellWrapperRenderer,
  ListTableCellCallbacks,
  ListTableCellEditingState,
  RowCells,
} from './ListTableCell'
import { ListTableColumnAttributeData, ListTableDataTypeWidgets } from './ListTableWidgets'
import type { ListTableGroupDisplay } from './ListTable.types'
import { GroupRow, isCustomGroupRowValue } from './ListTableGroupRow'

// --- DraggableRow (regular data row) ---

interface DraggableRowProps<TData extends RowData> {
  row: Row<TData>
  virtualRow: any
  isSelected: boolean
  rowIndex: number
  onRowClick: (rowId: string, rowIndex: number, e: React.MouseEvent) => void
  cellWrapper?: CellWrapperRenderer<TData>
  columnAttributeData?: ListTableColumnAttributeData
  dataTypeWidgets?: ListTableDataTypeWidgets<TData>
  editingState: ListTableCellEditingState
  callbacks: ListTableCellCallbacks<TData>
  getGroupDisplay?: (columnId: string, value: unknown) => ListTableGroupDisplay | undefined
}

function DraggableRowInner<TData extends RowData>({
  row,
  virtualRow,
  isSelected,
  rowIndex,
  onRowClick,
  cellWrapper,
  columnAttributeData,
  dataTypeWidgets,
  editingState,
  callbacks,
  getGroupDisplay,
}: DraggableRowProps<TData>) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  })

  // Group rows get a different, simpler rendering
  if (row.getIsGrouped() || isCustomGroupRowValue(row.original)) {
    const customGroupRow = isCustomGroupRowValue(row.original)
      ? (row.original as { __groupColumnId: string; __groupValue: unknown })
      : null
    const columnId = row.getIsGrouped()
      ? row.groupingColumnId ?? ''
      : customGroupRow?.__groupColumnId ?? ''
    const groupValue = row.getIsGrouped() ? row.getValue(columnId) : customGroupRow?.__groupValue
    return (
      <GroupRow
        groupColumnId={columnId}
        groupValue={groupValue}
        count={row.getLeafRows().length}
        depth={row.depth}
        isExpanded={row.getIsExpanded()}
        onToggle={row.getToggleExpandedHandler()}
        getGroupDisplay={getGroupDisplay}
        virtualStart={virtualRow.start}
      />
    )
  }

  const virtualTransform = `translateY(${virtualRow.start}px)`
  const dndTransform = transform ? CSS.Transform.toString(transform) : ''

  return (
    <Styled.TR
      ref={setNodeRef}
      style={{
        transform: `${virtualTransform} ${dndTransform}`,
        transition,
      }}
      tabIndex={-1}
      onClick={(e) => onRowClick(row.id, rowIndex, e)}
      className={clsx('table-list-row', { dragging: isDragging, selected: isSelected })}
    >
      <RowCells
        row={row}
        cellWrapper={cellWrapper}
        columnAttributeData={columnAttributeData}
        dataTypeWidgets={dataTypeWidgets}
        editingState={editingState}
        callbacks={callbacks}
      />
    </Styled.TR>
  )
}

export const DraggableRow = React.memo(DraggableRowInner) as typeof DraggableRowInner
