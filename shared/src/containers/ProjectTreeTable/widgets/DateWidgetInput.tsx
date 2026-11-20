import { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import { DateField } from '@ynput/ayon-react-components'
import { WidgetBaseProps } from './CellWidget'
import { fromDay, toDay } from './DateWidgetHelpers'

// ARC's date field as the cell: no border, background or padding of its own
const StyledDateField = styled(DateField)`
  &&& {
    width: 100%;
    min-width: 0;
    height: 100%;
    min-height: 0;
    border: none;
    border-radius: 0;
    background-color: transparent;
    font: inherit;
  }
`

interface DateWidgetInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>,
    WidgetBaseProps {
  value?: string
  onCancel?: () => void
  isMidnightExclusive?: boolean
}

/**
 * The date field used across AYON (ARC's DateField) in the cell: typed, or picked in its calendar.
 * Enter saves what is typed, one click a day; Escape keeps the date, and so does leaving the cell
 * unless another date is typed.
 */
export const DateWidgetInput = ({
  value,
  onChange,
  onCancel,
  isMidnightExclusive = false,
  ...props
}: DateWidgetInputProps) => {
  const day = toDay(value, isMidnightExclusive)
  const input = useRef<HTMLInputElement>(null)
  const lastKey = useRef('')
  const isDone = useRef(false)

  /** saves a day, or keeps the date when there is none; once */
  const finish = (newDay: string | null) => {
    if (isDone.current) return
    isDone.current = true
    const key = lastKey.current === 'Enter' ? 'Enter' : 'Click'
    if (newDay) onChange(fromDay(newDay, isMidnightExclusive), key)
    else onCancel?.()
    // a day picked: the keyboard goes on from the cell, not from the calendar gone with it
    if (key === 'Click') input.current?.closest('td')?.focus()
  }

  // the date selected to type over
  useLayoutEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])

  return (
    <span
      style={{ display: 'contents' }}
      // the calendar is in a portal; its events bubble to the cell, which would take the focus
      onMouseDown={(event) => event.stopPropagation()}
      onMouseUp={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.target !== input.current) event.stopPropagation()
      }}
    >
      <StyledDateField
        {...props}
        ref={input}
        value={day}
        defaultOpen
        // an emptied date stays to be fixed: a cell with a date can't be cleared here
        required={!!day}
        // saved when committed
        onChange={() => {}}
        onCommit={(newDay) => finish(newDay || null)}
        onKeyDownCapture={(event) => {
          lastKey.current = event.key
          if (event.key === 'Escape') finish(null)
        }}
        // Enter on the same day still moves on; anything else that leaves keeps the date
        onBlur={() => finish(lastKey.current === 'Enter' ? day || null : null)}
      />
    </span>
  )
}
