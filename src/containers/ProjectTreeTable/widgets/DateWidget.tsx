import { format } from 'date-fns'
import { forwardRef } from 'react'
import { DateWidgetInput } from './DateWidgetInput'
import { WidgetBaseProps } from './CellWidget'

interface DateWidgetProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'>,
    WidgetBaseProps {
  value: string
  isReadOnly?: boolean
  isInherited?: boolean
}

export const DateWidget = forwardRef<HTMLSpanElement, DateWidgetProps>(
  ({ value, isEditing, isReadOnly, isInherited, onChange, onCancelEdit, ...props }, ref) => {
    let dateString = ''
    try {
      dateString = format(new Date(value), 'dd-MM-yyyy')
    } catch (error) {
      console.error('Invalid date value:', value)
      dateString = 'Invalid Date'
    }

    if (isEditing) {
      return (
        <DateWidgetInput
          value={value}
          onChange={onChange}
          onCancel={onCancelEdit}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          {...(props as any)}
        />
      )
    }

    return (
      <span {...props} ref={ref}>
        {dateString}
      </span>
    )
  },
)
