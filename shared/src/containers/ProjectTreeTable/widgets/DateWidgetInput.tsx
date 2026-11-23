import { useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import { DateField } from '@ynput/ayon-react-components'
import { WidgetBaseProps } from './CellWidget'
import { fromDay, toDay } from './DateWidgetHelpers'

// ARC's date field, looking like the text editor (TextWidgetInput): it fills the cell, dark, with
// the focus outline
const StyledDateField = styled(DateField)`
  &&& {
    position: absolute;
    inset: 0;
    z-index: 10;
    width: auto;
    min-width: 0;
    height: auto;
    min-height: 0;
    border: none;
    border-radius: 0;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: inset 0 0 0 2px var(--md-sys-color-primary);
    font: inherit;
  }
  &&& > div {
    background-color: transparent;
    box-shadow: none;
    font: inherit;
    color: inherit;
  }
  &&& input {
    padding: 0 8px 0 9px;
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
