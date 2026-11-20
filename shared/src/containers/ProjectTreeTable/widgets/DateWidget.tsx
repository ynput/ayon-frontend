import { format, subMilliseconds } from 'date-fns'
import { forwardRef, Fragment, useImperativeHandle, useRef } from 'react'
import styled from 'styled-components'
import { DateWidgetCalendar } from './DateWidgetCalendar'
import { WidgetBaseProps } from './CellWidget'
import { formatUTCDate } from '../../../util/formatUTCDate'
import { DATE_FORMAT, TIME_FORMAT } from '../../../util/formatDate'
import { wrapMode } from './wrapMode'

const StyledDateValue = styled.span`
  white-space: nowrap;

  ${wrapMode`
    white-space: normal;
  `}
`

// nowrap per part so the line can only break between date and time, never inside either
const StyledDatePart = styled.span`
  white-space: nowrap;
`

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
    // the calendar's anchor while editing
    const valueRef = useRef<HTMLSpanElement>(null)
    useImperativeHandle(ref, () => valueRef.current as HTMLSpanElement)

    let dateString = ''
    let isInvalid = false
    if (value) {
      try {
        const formatString = showTime ? `${DATE_FORMAT}, ${TIME_FORMAT}` : DATE_FORMAT
        const date = isMidnightExclusive ? subMilliseconds(new Date(value), 1) : new Date(value)
        dateString = showTime ? format(date, formatString) : formatUTCDate(date, formatString)
      } catch (error) {
        console.error('Invalid date value:', value)
        dateString = 'Invalid Date'
        isInvalid = true
      }
    }

    const parts = dateString && !isInvalid ? dateString.split(', ') : []

    return (
      <StyledDateValue {...props} ref={valueRef}>
        {isInvalid
          ? dateString
          : parts.map((part, index) => (
              <Fragment key={index}>
                {index > 0 && ', '}
                <StyledDatePart>{part}</StyledDatePart>
              </Fragment>
            ))}
        {isEditing && !isReadOnly && (
          <DateWidgetCalendar
            value={value}
            anchor={valueRef}
            onChange={onChange}
            onCancel={onCancelEdit}
            isMidnightExclusive={isMidnightExclusive}
          />
        )}
      </StyledDateValue>
    )
  },
)
