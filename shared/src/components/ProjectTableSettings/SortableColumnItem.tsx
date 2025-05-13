import { FC } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ColumnItem from './ColumnItem'
import styled from 'styled-components'
import { SettingsPanelItem } from '../SettingsPanel'

interface SortableColumnItemProps {
  id: string
  column: SettingsPanelItem
  isPinned: boolean
  isHidden: boolean
  isHighlighted?: boolean
  onTogglePinning: (columnId: string) => void
  onToggleVisibility: (columnId: string) => void
}

const SortableColumnItem: FC<SortableColumnItemProps> = ({
  id,
  column,
  isPinned,
  isHidden,
  isHighlighted,
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
    <SortableItemWrapper
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'dragging' : ''}
      id={`column-settings-${id}`}
    >
      <ColumnItem
        column={column}
        isPinned={isPinned}
        isHidden={isHidden}
        isHighlighted={isHighlighted}
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
