import { forwardRef } from 'react'
import { TextWidgetInput } from './TextWidgetInput'
import { WidgetBaseProps } from './CellWidget'
import styled from 'styled-components'
import { AttributeData } from '../types'

const StyledBaseTextWidget = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

type AttributeType = AttributeData['type']
export type TextWidgetType = Extract<AttributeType, 'string' | 'integer' | 'float'>

interface TextWidgetProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'>,
    WidgetBaseProps {
  value: string
}

export const TextWidget = forwardRef<HTMLSpanElement, TextWidgetProps>(
  ({ value, isEditing, onChange, onCancelEdit, ...props }, ref) => {
    if (isEditing) {
      return (
        <TextWidgetInput value={value} onChange={onChange} onCancel={onCancelEdit} type={'text'} />
      )
    }

    return (
      <StyledBaseTextWidget {...props} ref={ref}>
        {value}
      </StyledBaseTextWidget>
    )
  },
)
