import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Row, RowData } from '@tanstack/react-table'
import clsx from 'clsx'
import * as Styled from './ListTable.styled'
import { RowCells } from './ListTableCell'

interface DraggableRowProps<TData extends RowData> {
  row: Row<TData>
  virtualRow: any
  isSelected: boolean
  rowIndex: number
  onRowClick: (rowId: string, rowIndex: number, e: React.MouseEvent) => void
}

export const DraggableRow = <TData extends RowData>({
  row,
  virtualRow,
  isSelected,
  rowIndex,
  onRowClick,
}: DraggableRowProps<TData>) => {
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
      <RowCells row={row} />
    </Styled.TR>
  )
}
