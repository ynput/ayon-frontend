import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Icon, InputSwitch } from '@ynput/ayon-react-components'
import * as Styled from './AttributeDropdown.styled'
import { AttributeData } from './AttributeDropdown'
import clsx from 'clsx'
import { useRef } from 'react'
import { kebabCase } from 'lodash'

type AttributeDropdownItemProps = {
  item: AttributeData
  isBeingDragged?: boolean
  onChange?: (attr: keyof AttributeData, value: string | boolean) => void
  onRemove?: () => void
  onDuplicate?: () => void
}

const AttributeDropdownItem = ({
  item,
  isBeingDragged,
  onChange,
  onRemove,
  onDuplicate,
}: AttributeDropdownItemProps) => {
  const icon = item.icon || 'question_mark'
  const iconColor = item.color && item.isColorEnabled ? item.color : 'initial'
  const labelRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLInputElement>(null)

  const focusLabelIfExpanded = () => {
    if (!item.isExpanded) {
      // Avoids jittery expand animation
      setTimeout(() => labelRef.current!.focus(), 250)
    }
  }

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
    animateLayoutChanges: () => false,
  })

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  }

  return (
    <Styled.AttributeDropdownItemWrapper
      ref={setNodeRef}
      style={style}
      className={clsx({ dragged: isBeingDragged })}
    >
      <Styled.AttributeDropdownItemHeader
        className={clsx({ expanded: item.isExpanded })}
        onClick={() => {
          onChange && onChange('isExpanded', !item.isExpanded)
          focusLabelIfExpanded()
        }}
      >
        {item.isIconEnabled && (
          <Icon className="icon" icon={icon && item.isIconEnabled ? icon : ''} />
        )}
        {item.isColorEnabled && <Styled.LabelColor style={{ backgroundColor: iconColor }} />}
        <span> {item.label} </span>
        <span className="spacer" />

        <Icon
          className="icon toggle-expand"
          icon={item.isExpanded ? 'collapse_all' : 'expand_all'}
        />
        <Icon
          {...listeners}
          {...attributes}
          className="icon draggable"
          icon="drag_indicator"
          id="icon"
        />
      </Styled.AttributeDropdownItemHeader>

      <Styled.AttributeDropdownItemBodyExpander className={clsx({ expanded: item.isExpanded })}>
        <Styled.AttributeDropdownItemBody
          className={clsx(item.isExpanded ? 'expanded' : 'collapsed')}
        >
          <Styled.Row key="label">
            <Styled.Label> Label </Styled.Label>
            <Styled.InputText
              ref={labelRef}
              value={item.label}
              autoFocus={item.isLabelFocused}
              onChange={(event) => {
                valueRef.current!.value = kebabCase(event.target.value)
                onChange && onChange('label', event.target.value)
              }}
            />
          </Styled.Row>

          <Styled.Row key="value">
            <Styled.Label> Value </Styled.Label>
            <Styled.InputText
              ref={valueRef}
              value={valueRef.current?.value || item.value}
              onChange={(event) => onChange && onChange('value', event.target.value)}
            />
          </Styled.Row>

          <Styled.Row key="icon">
            <Styled.Label> Icon </Styled.Label>
            <Styled.IconSelect
              disabled={!item.isIconEnabled}
              value={[icon]}
              style={{ maxWidth: 'auto' }}
              onChange={(value) => {
                if (item.isIconEnabled) {
                  return onChange && onChange('icon', value[0])
                }
              }}
            />
            <InputSwitch
              checked={item.isIconEnabled}
              onChange={(event) =>
                onChange && onChange('isIconEnabled', (event.target as HTMLInputElement).checked)
              }
            />
          </Styled.Row>

          <Styled.Row key="color">
            <Styled.Label> Color </Styled.Label>
            <Styled.ColorPicker
              style={{ backgroundColor: item.color }}
              className={clsx({ disabled: !item.isColorEnabled })}
              onClick={() => {
                if (item.isColorEnabled) {
                  colorPickerRef.current!.click()
                }
              }}
            >
              <input
                type="color"
                value={item.color || '#000000'}
                ref={colorPickerRef}
                onChange={(event) => {
                  if (item.isColorEnabled) {
                    onChange && onChange('color', event?.target.value.toString())
                  }
                }}
              />
            </Styled.ColorPicker>
            <InputSwitch
              checked={item.isColorEnabled}
              onChange={(event) =>
                onChange && onChange('isColorEnabled', (event.target as HTMLInputElement).checked)
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
        </Styled.AttributeDropdownItemBody>
      </Styled.AttributeDropdownItemBodyExpander>
    </Styled.AttributeDropdownItemWrapper>
  )
}

export default AttributeDropdownItem
