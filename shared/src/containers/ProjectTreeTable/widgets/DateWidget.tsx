import { format, subMilliseconds } from 'date-fns'
import { forwardRef, Fragment } from 'react'
import styled from 'styled-components'
import { DateWidgetInput } from './DateWidgetInput'
import { WidgetBaseProps } from './CellWidget'
import { formatUTCDate } from '../../../util/formatUTCDate'
import { wrapMode } from './wrapMode'

const StyledDateValue = styled.span`
  white-space: nowrap;

  ${wrapMode`
    white-space: normal;
    align-self: flex-start;
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
    let dateString = ''
    let isInvalid = false
    if (value) {
      try {
        const formatString = showTime ? 'dd-MM-yyyy HH:mm:ss' : 'dd-MM-yyyy'
        const date = isMidnightExclusive ? subMilliseconds(new Date(value), 1) : new Date(value)
        dateString = showTime ? format(date, formatString) : formatUTCDate(date, formatString)
      } catch (error) {
        console.error('Invalid date value:', value)
        dateString = 'Invalid Date'
        isInvalid = true
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

    const parts = dateString && !isInvalid ? dateString.split(' ') : []

    return (
      <StyledDateValue {...props} ref={ref}>
        {isInvalid
          ? dateString
          : parts.map((part, index) => (
              <Fragment key={index}>
                {index > 0 && ' '}
                <StyledDatePart>{part}</StyledDatePart>
              </Fragment>
            ))}
      </StyledDateValue>
    )
  },
)
