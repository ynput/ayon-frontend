import { FC } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ColumnItem, { ColumnItemData } from './ColumnItem'
import styled from 'styled-components'

interface SortableColumnItemProps {
  id: string
  column: ColumnItemData
  isPinned: boolean
  isHidden: boolean
  onTogglePinning: (columnId: string) => void
  onToggleVisibility: (columnId: string) => void
}

const SortableColumnItem: FC<SortableColumnItemProps> = ({
  id,
  column,
  isPinned,
  isHidden,
  onTogglePinning,
  onToggleVisibility,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <SortableItemWrapper ref={setNodeRef} style={style} className={isDragging ? 'dragging' : ''}>
      <ColumnItem
        column={column}
        isPinned={isPinned}
        isHidden={isHidden}
        onTogglePinning={onTogglePinning}
        onToggleVisibility={onToggleVisibility}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </SortableItemWrapper>
  )
}

const SortableItemWrapper = styled.div`
  &.dragging {
    z-index: 1;
    opacity: 0;
  }
`

export default SortableColumnItem
