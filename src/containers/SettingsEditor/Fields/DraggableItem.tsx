import { Icon } from '@ynput/ayon-react-components'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from "@dnd-kit/sortable"
import { ReactNode } from "react"


type Props = {
  id: string
  isVisible?: boolean
  children: ReactNode
  onRemove?: () => void
  onDuplicate?: () => void
}

const DraggableItem = ({
  id,
  isVisible,
  children,
}: Props) => {
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
      <div style={{ display: 'flex' }}>
        <Icon
          {...listeners}
          {...attributes}
          className="icon draggable"
          icon="drag_indicator"
          id="icon"
        />
        {children}
      </div>
    </div>
  )
}


export { DraggableItem }