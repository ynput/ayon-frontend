import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { EntityCard } from '@ynput/ayon-react-components'

const KanBanCard = ({ task, onClick, onKeyUp, isActive }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : undefined,
  }

  return (
    <EntityCard
      imageUrl={task.thumbnailUrl}
      title={task.name}
      subTitle={task.folderName}
      description={task.path}
      onClick={onClick}
      isActive={isActive}
      icon={task.statusIcon}
      iconColor={task.statusColor}
      titleIcon={task.taskIcon}
      style={{ width: 210, ...style }}
      ref={setNodeRef}
      onKeyUp={onKeyUp}
      isDragging={isDragging}
      isDraggable
      {...attributes}
      {...listeners}
    />
  )
}

export default KanBanCard
