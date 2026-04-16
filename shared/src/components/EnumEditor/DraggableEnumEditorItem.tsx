import clsx from 'clsx'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Icon } from '@ynput/ayon-react-components'

import * as Styled from './EnumEditor.styled'
import { AttributeData } from './EnumEditor'
import EnumEditorItem, { EnumEditorItemProps } from './EnumEditorItem'
import React from 'react'

type DivPt = Partial<React.HTMLAttributes<HTMLDivElement>>

export interface DraggableEnumEditorItemPt {
  wrapper?: DivPt
  header?: DivPt
  item?: EnumEditorItemProps
}

export interface DraggableEnumEditorItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  item: AttributeData
  isBeingDragged?: boolean
  onChange?: (attr: (keyof AttributeData)[], value: (boolean | string | undefined)[]) => void
  onRemove?: () => void
  onDuplicate?: () => void
  pt?: DraggableEnumEditorItemPt
}

const DraggableEnumEditorItem = ({
  item,
  isBeingDragged,
  onChange,
  onRemove,
  onDuplicate,
  pt,
  ...props
}: DraggableEnumEditorItemProps) => {
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
      {...pt?.wrapper}
      {...props}
      className={clsx(props.className, pt?.wrapper?.className, { dragged: isBeingDragged })}
    >
      <Styled.EnumItemHeader
        {...pt?.header}
        onClick={() => {
          onChange && onChange(['isExpanded'], [!isExpanded])
        }}
        className={clsx(pt?.header?.className, { expanded: isExpanded })}
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
          {...pt?.item}
        />
      </Styled.EnumItemBodyExpander>
    </Styled.EnumItemWrapper>
  )
}

export default DraggableEnumEditorItem
