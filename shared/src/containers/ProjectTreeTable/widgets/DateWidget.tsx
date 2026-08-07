import { format, subMilliseconds } from 'date-fns'
import { forwardRef } from 'react'
import { DateWidgetInput } from './DateWidgetInput'
import { WidgetBaseProps } from './CellWidget'
import { formatUTCDate } from '../../../util/formatUTCDate'

export interface DateWidgetProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onChange'>,
    WidgetBaseProps {
  value?: string
  isReadOnly?: boolean
  isInherited?: boolean
  showTime?: boolean
  isMidnightExclusive?: boolean
}

export const DateWidget = forwardRef<HTMLSpanElement, DateWidgetProps>(
  (
    {
      value,
      isEditing,
      isReadOnly,
      isInherited,
      onChange,
      onCancelEdit,
      showTime = false,
      isMidnightExclusive = false,
      ...props
    },
    ref,
  ) => {
    let dateString = ''
    if (value) {
      try {
        const formatString = showTime ? 'dd-MM-yyyy HH:mm:ss' : 'dd-MM-yyyy'
        const date = isMidnightExclusive ? subMilliseconds(new Date(value), 1) : new Date(value)
        dateString = showTime ? format(date, formatString) : formatUTCDate(date, formatString)
      } catch (error) {
        console.error('Invalid date value:', value)
        dateString = 'Invalid Date'
      }
    }

    if (isEditing) {
      return (
        <DateWidgetInput
          value={value}
          onChange={onChange}
          onCancel={onCancelEdit}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          isMidnightExclusive={isMidnightExclusive}
          {...(props as any)}
        />
      )
    }

    return (
      <span {...props} ref={ref} style={{ whiteSpace: 'nowrap' }}>
        {dateString}
      </span>
    )
  },
)
