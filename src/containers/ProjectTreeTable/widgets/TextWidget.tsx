import { forwardRef } from 'react'
import { TextWidgetInput } from './TextWidgetInput'
import { AttributeData } from '@api/rest/attributes'
import { WidgetBaseProps } from './CellWidget'
import styled from 'styled-components'

const StyledBaseTextWidget = styled.span`
  &.inherited {
    color: red;
  }
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
