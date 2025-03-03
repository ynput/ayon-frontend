import { format } from 'date-fns'
import { forwardRef } from 'react'
import { DateWidgetInput } from './DateWidgetInput'

interface DateWidgetProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  value: string
  isEditing?: boolean
  onChange: (value: string) => void
  onCancelEdit?: () => void
}

export const DateWidget = forwardRef<HTMLSpanElement, DateWidgetProps>(
  ({ value, isEditing, onChange, onCancelEdit, ...props }, ref) => {
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
