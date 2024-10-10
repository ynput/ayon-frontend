import { Icon } from '@ynput/ayon-react-components'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { ReactNode } from 'react'
import styled from 'styled-components'

const StyledIconWrapper = styled.div`
  height: var(--base-input-size);
  max-height: var(--base-input-size);
  display: flex;
  align-items: center;
`

const StyledIcon = styled(Icon)`
  user-select: none;
  &:hover {
    cursor: grab;
  }
`

const DraggableContainer = styled.div`
  display: flex;
  justify-content: center;
`

type Props = {
  id: string
  isVisible?: boolean
  children: ReactNode
}

const DraggableItem = ({ id, isVisible, children }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    animateLayoutChanges: () => false,
  })

  const dndStyle = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...dndStyle,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <DraggableContainer style={{ display: 'flex' }}>
        <StyledIconWrapper>
        <StyledIcon
          {...listeners}
          {...attributes}
          className="icon draggable"
          icon="drag_indicator"
          id="icon"
        />
        </StyledIconWrapper>
        {children}
      </DraggableContainer>
    </div>
  )
}

export default DraggableItem
