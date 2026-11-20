import { ReactNode, RefObject, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { isValid, parseISO, subMilliseconds } from 'date-fns'
import { DateRangeCalendar } from '@ynput/ayon-react-components'
import { formatUTCDate } from '@shared/util/formatUTCDate'
import { WidgetBaseProps } from './CellWidget'

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

interface DateWidgetCalendarProps extends WidgetBaseProps {
  value?: string
  /** the date as shown, under the calendar: its cell or field */
  anchor: RefObject<HTMLElement>
  onCancel?: () => void
  isMidnightExclusive?: boolean
}

/** the day of a date value, `YYYY-MM-DD`; a midnight-exclusive end is the day before */
const toDay = (value: string | undefined, isMidnightExclusive: boolean) => {
  const date = value ? parseISO(value) : undefined
  if (!date || !isValid(date)) return ''
  return formatUTCDate(isMidnightExclusive ? subMilliseconds(date, 1) : date, 'yyyy-MM-dd')
}

/**
 * A date edited in the calendar used across AYON (ARC's DateRangeCalendar), in a popover under
 * the cell rather than the browser's date input. One click picks the day; Escape or a click
 * elsewhere keeps the date.
 */
export const DateWidgetCalendar = ({
  value,
  anchor,
  onChange,
  onCancel,
  isMidnightExclusive = false,
}: DateWidgetCalendarProps) => {
  const popover = useRef<HTMLDivElement>(null)
  const day = toDay(value, isMidnightExclusive)
  const cancel = useRef(onCancel)
  cancel.current = onCancel
  // a day picked: the focus leaving with it is not a cancel
  const picked = useRef(false)

  // placed under the cell, or above it when there is no room below, then focused on the day:
  // the arrows move between days, Enter picks one
  useLayoutEffect(() => {
    const box = popover.current
    const field = anchor.current?.closest('td') ?? anchor.current
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
    box.querySelector<HTMLElement>('.react-datepicker__day[tabindex="0"]')?.focus()
  }, [anchor])

  // a click anywhere else closes it
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!popover.current?.contains(event.target as Node)) cancel.current?.()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const pick = (newDay: string) => {
    picked.current = true
    // the keyboard goes on from the cell, not from the calendar gone with it
    anchor.current?.closest('td')?.focus()
    if (newDay === day) return onCancel?.()
    const [y, m, d] = newDay.split('-').map(Number)
    onChange(new Date(Date.UTC(y, m - 1, d + Number(isMidnightExclusive))).toISOString(), 'Click')
  }

  return createPortal(
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
        if (event.key === 'Escape') onCancel?.()
      }}
      // Tab out of it keeps the date
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null
        if (next && !picked.current && !popover.current?.contains(next)) onCancel?.()
      }}
    >
      <DateRangeCalendar
        monthsShown={1}
        selectsRange={false}
        value={{ from: day, to: day }}
        onChange={({ from }) => pick(from)}
      />
    </Popover>,
    document.body,
  ) as ReactNode
}
