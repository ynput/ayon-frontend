import { useEffect, useRef } from 'react'
import { kebabCase } from 'lodash'

import { DropdownRef, Icon } from '@ynput/ayon-react-components'

import * as Styled from './EnumEditor.styled'
import { AttributeData } from './EnumEditor'
import clsx from 'clsx'

type DivPt = Partial<React.HTMLAttributes<HTMLDivElement>>

type TextInputPt = Partial<React.ComponentProps<typeof Styled.InputText>>
type IconInputPt = Partial<React.ComponentProps<typeof Styled.IconSelect>>
type ColorInputPt = Partial<React.InputHTMLAttributes<HTMLInputElement>>

export interface EnumEditorFieldPt<TInput> {
  wrapper?: DivPt
  label?: DivPt
  input?: Partial<TInput>
}

export interface EnumEditorItemPt {
  wrapper?: DivPt
  label?: EnumEditorFieldPt<TextInputPt>
  value?: EnumEditorFieldPt<TextInputPt>
  icon?: EnumEditorFieldPt<IconInputPt>
  color?: EnumEditorFieldPt<ColorInputPt>
  footer?: DivPt
}

export interface EnumEditorItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  item: AttributeData
  onChange?: (attr: (keyof AttributeData)[], value: (boolean | string | undefined)[]) => void
  onRemove?: () => void
  onDuplicate?: () => void
  showRemoveButton?: boolean
  showDuplicateButton?: boolean
  autoFocus?: boolean
  isExpanded?: boolean
  pt?: EnumEditorItemPt
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
  className,
  pt,
  ...props
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
    <Styled.EnumItemBody
      {...pt?.wrapper}
      {...props}
      className={clsx(className, pt?.wrapper?.className, {
        expanded: isExpanded,
        collapsed: !isExpanded,
      })}
    >
      <Styled.Row key="label" {...pt?.label?.wrapper}>
        <Styled.Label {...pt?.label?.label}>Label</Styled.Label>
        <Styled.InputText
          ref={labelRef}
          value={label}
          autoFocus={autoFocus || isNewAttribute}
          {...pt?.label?.input}
          className={clsx(pt?.label?.input?.className)}
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

      <Styled.Row key="value" {...pt?.value?.wrapper}>
        <Styled.Label {...pt?.value?.label}>Value</Styled.Label>
        <Styled.InputText
          ref={valueRef}
          value={valueRef.current?.value || value}
          {...pt?.value?.input}
          className={clsx(pt?.value?.input?.className)}
          onChange={(event) => onChange && onChange(['value'], [event.target.value])}
          placeholder="Enter value"
        />
      </Styled.Row>

      <Styled.Row key="icon" {...pt?.icon?.wrapper}>
        <Styled.Label {...pt?.icon?.label}>Icon</Styled.Label>

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
            {...pt?.icon?.input}
            className={clsx(pt?.icon?.input?.className)}
            style={{
              position: icon ? 'relative' : 'absolute',
              visibility: icon ? 'visible' : 'hidden',
              ...pt?.icon?.input?.style,
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

      <Styled.Row key="color" {...pt?.color?.wrapper}>
        <Styled.Label {...pt?.color?.label}>Color</Styled.Label>

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
              {...pt?.color?.input}
              className={clsx(pt?.color?.input?.className)}
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
        <Styled.Row {...pt?.footer} className={clsx('footer', pt?.footer?.className)}>
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
