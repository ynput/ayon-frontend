import { useDroppable } from '@dnd-kit/core'
import * as Styled from './KanBanColumn.styled'
const KanBanColumnDropzone = ({ item, activeColumn, disabled }) => {
  const { isOver, setNodeRef, over } = useDroppable({
    id: item.id,
    disabled,
  })

  const isOverSelf = over?.id === activeColumn?.id

  return (
    <Styled.DropColumn
      key={item.id}
      ref={setNodeRef}
      $color={item.color}
      $active={isOver && !isOverSelf && !disabled}
    >
      <div className="title">
        <span>{item.name}</span>
        {disabled && <span>(Disabled)</span>}
      </div>
    </Styled.DropColumn>
  )
}

export default KanBanColumnDropzone
