import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import clsx from 'clsx'
import { DateRangeCalendar } from '@ynput/ayon-react-components'
import { WidgetBaseProps } from './CellWidget'
import { formatDay, fromDay, parseTypedDay, toDay } from './DateWidgetHelpers'

const StyledInput = styled.input`
  z-index: 10;
  border: none;
  outline: none;
  padding: 0;
  padding-left: 1px;
  margin: 0;
  cursor: text;
  font-size: inherit;
  font-family: inherit;
  font-weight: inherit;
  color: inherit;
  background-color: transparent;
  width: 100%;
  box-sizing: border-box;

  &.error {
    color: var(--md-sys-color-error);
  }
`

// ARC's DateRangePicker popover
const Popover = styled.div`
  position: fixed;
  z-index: 1000;
  max-width: calc(100vw - 16px);
  max-height: calc(100vh - 16px);
  overflow: auto;
  border-radius: 8px;
  background-color: var(--md-sys-color-surface-container-high);
  box-shadow: 0 4px 16px #00000066;
`

interface DateWidgetInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>,
    WidgetBaseProps {
  value?: string
  onCancel?: () => void
  isMidnightExclusive?: boolean
}

/**
 * A date typed in the cell, or picked in the calendar used across AYON (ARC's DateRangeCalendar)
 * in a popover under it. Enter saves what is typed, one click a day; Escape keeps the date, and so
 * does a click elsewhere unless another date is typed.
 */
export const DateWidgetInput = ({
  value,
  onChange,
  onCancel,
  isMidnightExclusive = false,
  ...props
}: DateWidgetInputProps) => {
  const day = toDay(value, isMidnightExclusive)
  const [text, setText] = useState(() => formatDay(day))
  const [isInvalid, setIsInvalid] = useState(false)
  const typedDay = parseTypedDay(text)

  const input = useRef<HTMLInputElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const isDone = useRef(false)

  /** saves a day, or keeps the date when it is the same day or none; once */
  const finish = (newDay: string | null, key: 'Enter' | 'Click') => {
    if (isDone.current) return
    isDone.current = true
    if (newDay && (key === 'Enter' || newDay !== day))
      onChange(fromDay(newDay, isMidnightExclusive), key)
    else onCancel?.()
  }
  const finishRef = useRef(finish)
  finishRef.current = finish
  const typedRef = useRef(typedDay)
  typedRef.current = typedDay

  const isOutside = (node: Node | null) =>
    !!node && !input.current?.contains(node) && !popover.current?.contains(node)

  // the date selected to type over, and the calendar under the cell, or above it when there is no
  // room below
  useLayoutEffect(() => {
    input.current?.focus()
    input.current?.select()
    const box = popover.current
    const field = input.current?.closest('td') ?? input.current
    if (!box || !field) return
    const rect = field.getBoundingClientRect()
    const below = rect.bottom + 4
    const above = rect.top - 4 - box.offsetHeight
    const top =
      below + box.offsetHeight <= window.innerHeight - 8
        ? below
        : above >= 8
        ? above
        : Math.max(8, window.innerHeight - box.offsetHeight - 8)
    box.style.top = `${top}px`
    box.style.left = `${Math.max(
      8,
      Math.min(rect.left, window.innerWidth - box.offsetWidth - 8),
    )}px`
    box.style.visibility = 'visible'
  }, [])

  // a click anywhere else saves the date typed, if any
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (isOutside(event.target as Node)) finishRef.current(typedRef.current, 'Click')
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Tab out of the input or calendar does the same; moving between them does not
  const onBlur = (event: React.FocusEvent) => {
    if (isOutside(event.relatedTarget as Node | null)) finish(typedDay, 'Click')
  }

  const pick = (picked: string) => {
    finish(picked, 'Click')
    // the keyboard goes on from the cell, not from the calendar gone with it
    input.current?.closest('td')?.focus()
  }

  return (
    <>
      <StyledInput
        {...props}
        ref={input}
        value={text}
        className={clsx(props.className, { error: isInvalid })}
        aria-invalid={isInvalid}
        onChange={(event) => {
          setText(event.target.value)
          setIsInvalid(false)
        }}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            // an empty cell keeps its date; a date not understood stays to be fixed
            if (typedDay || !text.trim()) finish(typedDay, 'Enter')
            else setIsInvalid(true)
          } else if (event.key === 'Escape') {
            event.preventDefault()
            finish(null, 'Click')
          } else if (event.key === 'ArrowDown') {
            // into the calendar: the arrows move between its days, Enter picks one
            event.preventDefault()
            popover.current
              ?.querySelector<HTMLElement>('.react-datepicker__day[tabindex="0"]')
              ?.focus()
          }
        }}
        // The table focuses its cell on mousedown, which would blur and unmount this editor.
        onMouseDown={(e) => e.stopPropagation()}
      />
      {createPortal(
        <Popover
          ref={popover}
          role="dialog"
          aria-label="Choose a date"
          style={{ visibility: 'hidden' }}
          // the portal bubbles events to the table cell, which would take the focus and selection
          onMouseDown={(event) => event.stopPropagation()}
          onMouseUp={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.key === 'Escape') finish(null, 'Click')
          }}
          onBlur={onBlur}
        >
          <DateRangeCalendar
            monthsShown={1}
            selectsRange={false}
            // the day typed, as it is typed
            value={{ from: typedDay ?? day, to: typedDay ?? day }}
            onChange={({ from }) => pick(from)}
          />
        </Popover>,
        document.body,
      )}
    </>
  )
}
