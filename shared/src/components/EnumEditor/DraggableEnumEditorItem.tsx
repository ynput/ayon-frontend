import clsx from 'clsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Icon } from '@ynput/ayon-react-components'

import * as Styled from './EnumEditor.styled'
import { AttributeData } from './EnumEditor'
import EnumEditorItem from './EnumEditorItem'

type Props = {
  item: AttributeData
  isBeingDragged?: boolean
  onChange?: (attr: (keyof AttributeData)[], value: (boolean | string | undefined)[]) => void
  onRemove?: () => void
  onDuplicate?: () => void
}

const DraggableEnumEditorItem = ({
  item,
  isBeingDragged,
  onChange,
  onRemove,
  onDuplicate,
}: Props) => {
  const { id, label, icon, color, isExpanded } = item

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: id,
    animateLayoutChanges: () => false,
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  return (
    <Styled.EnumItemWrapper
      ref={setNodeRef}
      style={style}
      className={clsx({ dragged: isBeingDragged })}
    >
      <Styled.EnumItemHeader
        className={clsx({ expanded: isExpanded })}
        onClick={() => {
          onChange && onChange(['isExpanded'], [!isExpanded])
        }}
      >
        {color && <Styled.LabelColor style={{ backgroundColor: color }} />}
        {icon && <Icon className="icon" icon={icon} />}
        <span> {label} </span>
        <span className="spacer" />

        <Icon className="icon toggle-expand" icon={isExpanded ? 'collapse_all' : 'expand_all'} />
        <Icon
          {...listeners}
          {...attributes}
          className="icon draggable"
          icon="drag_indicator"
          id="icon"
        />
      </Styled.EnumItemHeader>

      <Styled.EnumItemBodyExpander className={clsx({ expanded: isExpanded })}>
        <EnumEditorItem
          item={item}
          onChange={onChange}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          showRemoveButton={true}
          showDuplicateButton={true}
          autoFocus={false}
          isExpanded={isExpanded}
        />
      </Styled.EnumItemBodyExpander>
    </Styled.EnumItemWrapper>
  )
}

export default DraggableEnumEditorItem
