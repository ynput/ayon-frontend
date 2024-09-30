import clsx from 'clsx'
import { kebabCase } from 'lodash'
import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Icon, InputSwitch } from '@ynput/ayon-react-components'

import * as Styled from './DraggableAttributeEnum.styled'
import { AttributeData } from './DraggableAttributeEnum'

type Props = {
  item: AttributeData
  isBeingDragged?: boolean
  onChange?: (attr: (keyof AttributeData)[], value: (boolean | string | undefined)[]) => void
  onRemove?: () => void
  onDuplicate?: () => void
}

const DraggableAttributeEnumItem = ({
  item,
  isBeingDragged,
  onChange,
  onRemove,
  onDuplicate,
}: Props) => {
  const { id, label, value, color, isColorEnabled, isIconEnabled, isExpanded, isLabelFocused } =
    item
  const icon = item.icon || 'question_mark'
  const iconColor = color && isColorEnabled ? color : 'initial'
  const labelRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLInputElement>(null)

  const focusLabelIfExpanded = () => {
    if (!isExpanded) {
      // Avoids jittery expand animation
      setTimeout(() => labelRef.current!.focus(), 250)
    }
  }

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
          focusLabelIfExpanded()
        }}
      >
        {isIconEnabled && <Icon className="icon" icon={icon && isIconEnabled ? icon : ''} />}
        {isColorEnabled && <Styled.LabelColor style={{ backgroundColor: iconColor }} />}
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
        <Styled.EnumItemBody className={clsx(isExpanded ? 'expanded' : 'collapsed')}>
          <Styled.Row key="label">
            <Styled.Label> Label </Styled.Label>
            <Styled.InputText
              ref={labelRef}
              value={label}
              autoFocus={isLabelFocused}
              onChange={(event) => {
                valueRef.current!.value = kebabCase(event.target.value)
                if (onChange) {
                  onChange(['label', 'value'], [event.target.value, valueRef.current!.value])
                }
              }}
            />
          </Styled.Row>

          <Styled.Row key="value">
            <Styled.Label> Value </Styled.Label>
            <Styled.InputText
              ref={valueRef}
              value={valueRef.current?.value || value}
              onChange={(event) => onChange && onChange(['value'], [event.target.value])}
            />
          </Styled.Row>

          <Styled.Row key="icon">
            <Styled.Label> Icon </Styled.Label>
            <Styled.IconSelect
              disabled={!isIconEnabled}
              value={[icon]}
              style={{ maxWidth: 'auto' }}
              onChange={(value) => {
                if (isIconEnabled) {
                  return onChange && onChange(['icon'], [value[0]])
                }
              }}
            />
            <InputSwitch
              checked={isIconEnabled}
              onChange={(event) =>
                onChange && onChange(['isIconEnabled'], [(event.target as HTMLInputElement).checked])
              }
            />
          </Styled.Row>

          <Styled.Row key="color">
            <Styled.Label> Color </Styled.Label>
            <Styled.ColorPicker
              style={{ backgroundColor: color }}
              className={clsx({ disabled: !isColorEnabled })}
              onClick={() => {
                if (isColorEnabled) {
                  colorPickerRef.current!.click()
                }
              }}
            >
              <input
                type="color"
                value={color || '#000000'}
                ref={colorPickerRef}
                onChange={(event) => {
                  if (isColorEnabled) {
                    onChange && onChange(['color'], [event?.target.value.toString()])
                  }
                }}
              />
            </Styled.ColorPicker>
            <InputSwitch
              checked={isColorEnabled}
              onChange={(event) =>
                onChange && onChange(['isColorEnabled'], [(event.target as HTMLInputElement).checked])
              }
            />
          </Styled.Row>

          <Styled.Row className="footer">
            <Styled.ActionWrapper>
              <Styled.Button icon="close" variant="text" onClick={onRemove}>
                Remove
              </Styled.Button>
            </Styled.ActionWrapper>
            <Styled.ActionWrapper>
              <Styled.Button icon="content_copy" variant="text" onClick={onDuplicate}>
                Duplicate
              </Styled.Button>
            </Styled.ActionWrapper>
          </Styled.Row>
        </Styled.EnumItemBody>
      </Styled.EnumItemBodyExpander>
    </Styled.EnumItemWrapper>
  )
}

export default DraggableAttributeEnumItem
