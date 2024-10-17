import { Icon } from '@ynput/ayon-react-components'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { ReactNode } from 'react'
import styled from 'styled-components'
import clsx from 'clsx'

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

  padding: 4px;
  padding-right: 0;
  border-radius: 4px;
  margin-right: 4px;

  /* highlight row if: */
  &:has(> div > span.icon:hover), // drag icon hovered
  &:has(> div > div > div > button.delete:hover) // delete button hovered
  {
    background-color: var(--md-sys-color-surface-container-high);
  }

  &.isOverlay {
    background-color: var(--md-sys-color-surface-container-high);
    box-shadow: 0 0 4px 1px rgba(0, 0, 0, 0.1);
    /* face delete icon */
    [icon='delete'] {
      opacity: 0.4;
    }
  }
`

type Props = {
  id: string
  isVisible?: boolean
  children: ReactNode
  isOverlay?: boolean
}

const DraggableItem = ({ id, isVisible = true, isOverlay, children }: Props) => {
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
      <DraggableContainer style={{ display: 'flex' }} className={clsx({ isOverlay })}>
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
