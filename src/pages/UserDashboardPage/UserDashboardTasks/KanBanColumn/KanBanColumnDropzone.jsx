import { useDroppable } from '@dnd-kit/core'
import * as Styled from './KanBanColumn.styled'
import clsx from 'clsx'
const KanBanColumnDropzone = ({ item, activeColumn, disabled }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: item.id,
    disabled,
  })

  const isDraggingFrom = item.id === activeColumn?.id

  return (
    <Styled.DropColumn
      key={item.id}
      ref={setNodeRef}
      $color={item.color}
      className={clsx({
        source: isDraggingFrom,
        'drop-active': isOver && !isDraggingFrom && !disabled,
      })}
    >
      <div className="title">
        <span>{item.name}</span>
        {disabled && <span>(Disabled)</span>}
      </div>
    </Styled.DropColumn>
  )
}

export default KanBanColumnDropzone
