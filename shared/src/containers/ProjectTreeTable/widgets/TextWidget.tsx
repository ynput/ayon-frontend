import { forwardRef } from 'react'
import { TextWidgetInput } from './TextWidgetInput'
import { WidgetBaseProps } from './CellWidget'
import styled from 'styled-components'
import { AttributeData } from '../types'
import { AttributeEnumItem } from '@shared/api'
import { Icon } from '@ynput/ayon-react-components'

const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  display: flex;
  gap: 4px;
`

type AttributeType = AttributeData['type']
export type TextWidgetType = Extract<AttributeType, 'string' | 'integer' | 'float'>

interface TextWidgetProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'>,
    WidgetBaseProps {
  value: string
  option?: AttributeEnumItem
  isInherited?: boolean
}

export const TextWidget = forwardRef<HTMLSpanElement, TextWidgetProps>(
  ({ value, option, isEditing, isInherited, onChange, onCancelEdit, style, ...props }, ref) => {
    if (isEditing) {
      return (
        <TextWidgetInput value={value} onChange={onChange} onCancel={onCancelEdit} type={'text'} />
      )
    }

    return (
      <StyledBaseTextWidget style={{ color: option?.color, ...style }} {...props} ref={ref}>
        {option?.icon && (
          <Icon
            icon={option.icon}
            style={{
              color: option.color,
            }}
          />
        )}
        {option?.label || value}
      </StyledBaseTextWidget>
    )
  },
)
