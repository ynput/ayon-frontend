import { forwardRef } from 'react'
import { TextWidgetInput } from './TextWidgetInput'
import { AttributeData } from '@api/rest/attributes'

type AttributeType = AttributeData['type']
export type TextWidgetType = Extract<AttributeType, 'string' | 'integer' | 'float'>

interface TextWidgetProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  value: string
  isEditing?: boolean
  type: TextWidgetType
  onChange: (value: string) => void
  onCancelEdit?: () => void
}

export const TextWidget = forwardRef<HTMLSpanElement, TextWidgetProps>(
  ({ value, isEditing, onChange, onCancelEdit, type, ...props }, ref) => {
    if (isEditing) {
      const typeMappings: Record<TextWidgetType, 'text' | 'number'> = {
        string: 'text',
        integer: 'number',
        float: 'number',
      }

      return (
        <TextWidgetInput
          value={value}
          onChange={onChange}
          onCancel={onCancelEdit}
          type={typeMappings[type] || 'text'}
        />
      )
    }

    return (
      <span {...props} ref={ref}>
        {value}
      </span>
    )
  },
)
