import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import clsx from 'clsx'
import * as Styled from './NavRail.styled'

/** Where a dragged entry would go if dropped on this one. */
export type DropWhere = 'before' | 'after' | 'into'

/**
 * A sidebar entry while the layout is edited: it drags anywhere on the sidebar. Entries don't
 * move aside while one is dragged (a copy follows the pointer); `drop` shows where it would go.
 */
const DropEntry = ({
  id,
  drop,
  children,
}: {
  id: string
  drop?: DropWhere
  children: ReactNode
}) => {
  const { setNodeRef, attributes, listeners, isDragging } = useSortable({ id })
  return (
    <Styled.DraggableEntry
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={clsx(drop && `drop-${drop}`, { dragging: isDragging })}
    >
      {children}
    </Styled.DraggableEntry>
  )
}

export default DropEntry
