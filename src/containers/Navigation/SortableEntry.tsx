import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import * as Styled from './NavRail.styled'

/** A sidebar item while the layout is edited: it drags to a new place in its group. */
const SortableEntry = ({ id, children }: { id: string; children: ReactNode }) => {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <Styled.SortableEntry
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined,
      }}
    >
      {children}
    </Styled.SortableEntry>
  )
}

export default SortableEntry
