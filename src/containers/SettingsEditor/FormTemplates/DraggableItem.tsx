import { Icon } from '@ynput/ayon-react-components'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { ReactNode } from 'react'
import styled from 'styled-components'
import clsx from 'clsx'
import type { ListItemLayout } from './listItemLayout'

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
  /** Flat layout: the handle hides until the item is hovered, see SettingsEditor.sass */
  flatLayout?: boolean
  /** How the item is drawn in the flat layout: the box's class (is-row, is-card, is-fold,
   * is-plain, is-simple) that SettingsEditor.sass styles it by */
  layout?: ListItemLayout
}

// the class of an item's box in the flat layout
const getItemBoxClass = (flatLayout?: boolean, layout?: ListItemLayout) =>
  flatLayout &&
  clsx('settings-array-item', layout && `is-${layout.simple ? 'simple' : layout.presentation}`)

const DraggableItem = ({
  id,
  isVisible = true,
  isOverlay,
  flatLayout,
  layout,
  children,
}: Props) => {
  const boxClass = getItemBoxClass(flatLayout, layout)
  if (isOverlay) {
    return <DragPreview boxClass={boxClass}>{children}</DragPreview>
  }

  return (
    <SortableDraggableItem id={id} isVisible={isVisible} boxClass={boxClass}>
      {children}
    </SortableDraggableItem>
  )
}

const DragPreview = ({
  boxClass,
  children,
}: {
  boxClass?: string | false
  children: ReactNode
}) => (
  <div>
    <DraggableContainer style={{ display: 'flex' }} className={clsx('isOverlay', boxClass)}>
      <StyledIconWrapper className="drag-handle">
        <StyledIcon className="icon draggable" icon="drag_indicator" id="icon" />
      </StyledIconWrapper>
      {children}
    </DraggableContainer>
  </div>
)

const SortableDraggableItem = ({
  id,
  isVisible,
  boxClass,
  children,
}: {
  id: string
  isVisible: boolean
  boxClass?: string | false
  children: ReactNode
}) => {
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
      <DraggableContainer style={{ display: 'flex' }} className={clsx(boxClass)}>
        <StyledIconWrapper className="drag-handle">
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
