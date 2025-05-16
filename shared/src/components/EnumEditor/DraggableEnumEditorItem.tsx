import clsx from 'clsx'
import { kebabCase } from 'lodash'
import { useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { DropdownRef, Icon } from '@ynput/ayon-react-components'

import * as Styled from './EnumEditor.styled'
import { AttributeData } from './EnumEditor'

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
  const { id, label, value, icon, color, isExpanded, isNewAttribute } = item
  const labelRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLInputElement>(null)
  const iconSelectRef = useRef<DropdownRef>(null)

  const focusLabelIfExpanded = () => {
    if (!isExpanded) {
      // Avoids jittery expand animation
      setTimeout(() => labelRef.current!.focus(), 250)
    }
  }

  useEffect(() => {
    if (item.isNewAttribute) {
      labelRef.current!.select()
    }
  }, [])

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
        <Styled.EnumItemBody className={clsx(isExpanded ? 'expanded' : 'collapsed')}>
          <Styled.Row key="label">
            <Styled.Label> Label </Styled.Label>
            <Styled.InputText
              ref={labelRef}
              value={label}
              autoFocus={isNewAttribute}
              onChange={(event) => {
                if (!isNewAttribute) {
                  return onChange && onChange(['label'], [event.target.value])
                }
                valueRef.current!.value = kebabCase(event.target.value)
                onChange &&
                  onChange(['label', 'value'], [event.target.value, kebabCase(event.target.value)])
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

            <Styled.PlaceholderWrapper style={{ position: 'relative' }}>
              {
                <Styled.Placeholder
                  style={{ display: icon ? 'none' : 'flex' }}
                  onClick={() => {
                    iconSelectRef.current!.open()
                  }}
                >
                  Pick an icon...
                </Styled.Placeholder>
              }

              <Styled.IconSelect
                ref={iconSelectRef}
                value={[icon || 'question_mark']}
                widthExpand
                style={{
                  position: icon ? 'relative' : 'absolute',
                  visibility: icon ? 'visible' : 'hidden',
                }}
                onChange={(value) => {
                  return onChange && onChange(['icon'], [value[0]])
                }}
              />
              {icon && (
                <Styled.Button
                  icon="close"
                  variant="text"
                  onClick={() => {
                    onChange && onChange(['icon'], [undefined])
                  }}
                />
              )}
            </Styled.PlaceholderWrapper>
          </Styled.Row>

          <Styled.Row key="color">
            <Styled.Label> Color </Styled.Label>

            <Styled.PlaceholderWrapper style={{ position: 'relative' }}>
              <Styled.ColorPicker
                className={clsx({ active: color })}
                style={{ backgroundColor: color || undefined }}
                onClick={() => colorPickerRef.current!.click()}
              >
                {!color ? 'Pick a color...' : ''}
                <input
                  type="color"
                  ref={colorPickerRef}
                  value={color || '#000000'}
                  onChange={(event) =>
                    onChange && onChange(['color'], [event?.target.value.toString()])
                  }
                />
              </Styled.ColorPicker>
              {color && (
                <Styled.Button
                  icon="close"
                  variant="text"
                  onClick={() => {
                    onChange && onChange(['color'], [undefined])
                  }}
                />
              )}
            </Styled.PlaceholderWrapper>
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

export default DraggableEnumEditorItem
