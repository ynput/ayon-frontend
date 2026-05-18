import { flexRender, Header, RowData } from '@tanstack/react-table'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import * as Styled from './ListTable.styled'

interface SortableTHProps<TData> {
  header: Header<TData, any>
  enabled: boolean
}

export function SortableTHComponent<TData extends RowData>({
  header,
  enabled,
}: SortableTHProps<TData>) {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id: header.id,
    data: { type: 'column' },
    disabled: !enabled,
  })

  return (
    <Styled.SortableTHStyled
      ref={setNodeRef}
      style={{
        width: header.getSize(),
        transform: CSS.Transform.toString(transform) ?? undefined,
        transition,
      }}
      className={clsx({ grab: enabled, dragging: isDragging })}
      {...(enabled ? { ...attributes, ...listeners } : {})}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </Styled.SortableTHStyled>
  )
}
