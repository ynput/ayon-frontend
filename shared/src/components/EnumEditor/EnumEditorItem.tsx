import { useEffect, useRef } from 'react'
import { kebabCase } from 'lodash'

import { DropdownRef, Icon } from '@ynput/ayon-react-components'

import * as Styled from './EnumEditor.styled'
import { AttributeData } from './EnumEditor'

interface EnumEditorItemProps {
  item: AttributeData
  onChange?: (attr: (keyof AttributeData)[], value: (boolean | string | undefined)[]) => void
  onRemove?: () => void
  onDuplicate?: () => void
  showRemoveButton?: boolean
  showDuplicateButton?: boolean
  autoFocus?: boolean
  isExpanded?: boolean
}

const EnumEditorItem = ({
  item,
  onChange,
  onRemove,
  onDuplicate,
  showRemoveButton = true,
  showDuplicateButton = true,
  autoFocus = false,
  isExpanded = true,
}: EnumEditorItemProps) => {
  const { label, value, icon, color, isNewAttribute } = item
  const labelRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLInputElement>(null)
  const iconSelectRef = useRef<DropdownRef>(null)

  useEffect(() => {
    if (autoFocus || item.isNewAttribute) {
      labelRef.current?.select()
    }
  }, [autoFocus, item.isNewAttribute])

  // Handle focus when item becomes expanded
  useEffect(() => {
    if (isExpanded && !autoFocus && !item.isNewAttribute) {
      // Avoids jittery expand animation
      setTimeout(() => labelRef.current?.focus(), 250)
    }
  }, [isExpanded, autoFocus, item.isNewAttribute])

  return (
    <Styled.EnumItemBody className={isExpanded ? 'expanded' : 'collapsed'}>
      <Styled.Row key="label">
        <Styled.Label>Label</Styled.Label>
        <Styled.InputText
          ref={labelRef}
          value={label}
          autoFocus={autoFocus || isNewAttribute}
          onChange={(event) => {
            if (!isNewAttribute) {
              return onChange && onChange(['label'], [event.target.value])
            }
            if (valueRef.current) {
              valueRef.current.value = kebabCase(event.target.value)
            }
            onChange &&
              onChange(['label', 'value'], [event.target.value, kebabCase(event.target.value)])
          }}
          placeholder="Enter label"
        />
      </Styled.Row>

      <Styled.Row key="value">
        <Styled.Label>Value</Styled.Label>
        <Styled.InputText
          ref={valueRef}
          value={valueRef.current?.value || value}
          onChange={(event) => onChange && onChange(['value'], [event.target.value])}
          placeholder="Enter value"
        />
      </Styled.Row>

      <Styled.Row key="icon">
        <Styled.Label>Icon</Styled.Label>

        <Styled.PlaceholderWrapper style={{ position: 'relative' }}>
          <Styled.Placeholder
            style={{ display: icon ? 'none' : 'flex' }}
            onClick={() => {
              iconSelectRef.current?.open()
            }}
          >
            Pick an icon...
          </Styled.Placeholder>

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
        <Styled.Label>Color</Styled.Label>

        <Styled.PlaceholderWrapper style={{ position: 'relative' }}>
          <Styled.ColorPicker
            className={color ? 'active' : ''}
            style={{ backgroundColor: color || undefined }}
            onClick={() => colorPickerRef.current?.click()}
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

      {(showRemoveButton || showDuplicateButton) && (
        <Styled.Row className="footer">
          {showRemoveButton && (
            <Styled.ActionWrapper>
              <Styled.Button icon="close" variant="text" onClick={onRemove}>
                Remove
              </Styled.Button>
            </Styled.ActionWrapper>
          )}
          {showDuplicateButton && (
            <Styled.ActionWrapper>
              <Styled.Button icon="content_copy" variant="text" onClick={onDuplicate}>
                Duplicate
              </Styled.Button>
            </Styled.ActionWrapper>
          )}
        </Styled.Row>
      )}
    </Styled.EnumItemBody>
  )
}

export default EnumEditorItem
