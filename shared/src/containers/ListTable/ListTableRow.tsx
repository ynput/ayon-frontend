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
}: DraggableRowProps<TData>) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  })

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
