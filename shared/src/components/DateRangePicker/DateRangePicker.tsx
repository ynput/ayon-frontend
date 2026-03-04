import {
  FC,
  useState,
  useRef,
  useEffect,
  ReactNode,
  useCallback,
  HTMLAttributes,
  ButtonHTMLAttributes,
  LabelHTMLAttributes,
  InputHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { format, isValid, parseISO } from 'date-fns'
import * as Styled from './DateRangePicker.styled'
import clsx from 'clsx'
import { BLOCK_DIALOG_CLOSE_CLASS } from '../LinksManager/CellEditingDialog'
import { ButtonProps } from '@ynput/ayon-react-components'

export interface DateRangePickerPassthrough {
  root?: Partial<HTMLAttributes<HTMLDivElement>>
  trigger?: Partial<ButtonHTMLAttributes<HTMLButtonElement>>
  dropdown?: Partial<HTMLAttributes<HTMLDivElement>>
  content?: Partial<HTMLAttributes<HTMLDivElement>>
  startDate?: Partial<{
    field?: Partial<HTMLAttributes<HTMLDivElement>>
    label?: Partial<LabelHTMLAttributes<HTMLLabelElement>>
    input?: Partial<InputHTMLAttributes<HTMLInputElement>>
  }>
  endDate?: Partial<{
    field?: Partial<HTMLAttributes<HTMLDivElement>>
    label?: Partial<LabelHTMLAttributes<HTMLLabelElement>>
    input?: Partial<InputHTMLAttributes<HTMLInputElement>>
  }>
  clearButton?: Partial<ButtonProps>
  closeButton?: Partial<ButtonProps>
  valueDisplay?: Partial<HTMLAttributes<HTMLSpanElement>>
}

export interface DateRange {
  startDate: string | null
  endDate: string | null
}

export interface DateRangePickerProps {
  /** Current date range value */
  value: DateRange
  /** Callback when date range changes */
  onChange: (range: DateRange) => void
  /** Custom trigger button when no dates are set */
  emptyTrigger?: ReactNode
  /** Custom trigger button when dates are set */
  valueTrigger?: (range: DateRange, formattedRange: string) => ReactNode
  /** Alignment of the dropdown relative to trigger */
  align?: 'left' | 'right'
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Additional class name for the container */
  className?: string
  /** Format for displaying dates (default: 'MMM d') */
  displayFormat?: string
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date
  /** Passthrough props for internal components */
  pt?: DateRangePickerPassthrough
}

const formatDateForInput = (dateStr: string | null): string => {
  if (!dateStr) return ''
  try {
    const date = parseISO(dateStr)
    if (isValid(date)) {
      return format(date, 'yyyy-MM-dd')
    }
  } catch {
    return ''
  }
  return ''
}

const formatDateForDisplay = (dateStr: string | null, formatStr: string): string | null => {
  if (!dateStr) return null
  try {
    const date = parseISO(dateStr)
    if (isValid(date)) {
      return format(date, formatStr)
    }
  } catch {
    return null
  }
  return null
}

const parseDateInput = (value: string): string | null => {
  if (!value) return null
  try {
    const date = new Date(value)
    if (isValid(date)) {
      date.setUTCHours(0, 0, 0, 0)
      return date.toISOString()
    }
  } catch {
    return null
  }
  return null
}

export const DateRangePicker: FC<DateRangePickerProps> = ({
  value,
  onChange,
  emptyTrigger,
  valueTrigger,
  align = 'left',
  disabled = false,
  className,
  displayFormat = 'MMM d',
  minDate,
  maxDate,
  pt,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [localStartDate, setLocalStartDate] = useState('')
  const [localEndDate, setLocalEndDate] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const startDateInputRef = useRef<HTMLInputElement>(null)
  const endDateInputRef = useRef<HTMLInputElement>(null)

  const hasValue = value.startDate || value.endDate

  const handleSaveAndClose = useCallback(() => {
    const start = parseDateInput(localStartDate)
    const end = parseDateInput(localEndDate)
    if (start !== value.startDate || end !== value.endDate) {
      onChange({ startDate: start, endDate: end })
    }
    setIsOpen(false)
  }, [localStartDate, localEndDate, value.startDate, value.endDate, onChange])

  useEffect(() => {
    if (isOpen) {
      setLocalStartDate(formatDateForInput(value.startDate))
      setLocalEndDate(formatDateForInput(value.endDate))

      // Automatically open start date picker if no dates are set
      if (!value.startDate && !value.endDate) {
        setTimeout(() => {
          try {
            startDateInputRef.current?.showPicker()
          } catch (err) {
            // fallback
          }
        }, 100)
      }
    }
  }, [isOpen, value.startDate, value.endDate])

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        handleSaveAndClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, handleSaveAndClose])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleSaveAndClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleSaveAndClose])

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalStartDate(newValue)

    const newStartDate = parseDateInput(newValue)
    const currentEndDate = parseDateInput(localEndDate)

    // Validate: startDate cannot be after endDate
    if (newStartDate && currentEndDate) {
      const start = new Date(newStartDate)
      const end = new Date(currentEndDate)
      if (start > end) {
        // If start is after end, set end to same as start
        setLocalEndDate(newValue)
      }
    }

    // Automatically open end date picker after start date is selected
    if (newStartDate) {
      setTimeout(() => {
        try {
          endDateInputRef.current?.showPicker()
        } catch (err) {
          // fallback
        }
      }, 100)
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalEndDate(newValue)

    const newEndDate = parseDateInput(newValue)
    const currentStartDate = parseDateInput(localStartDate)

    let finalStart = currentStartDate
    let finalEnd = newEndDate

    // Validate: endDate cannot be before startDate
    if (newEndDate && currentStartDate) {
      const start = new Date(currentStartDate)
      const end = new Date(newEndDate)
      if (end < start) {
        // If end is before start, set start to same as end
        setLocalStartDate(newValue)
        finalStart = newEndDate
      }
    }

    onChange({ startDate: finalStart, endDate: finalEnd })
  }

  const handleClear = () => {
    setLocalStartDate('')
    setLocalEndDate('')
    onChange({ startDate: null, endDate: null })
    setIsOpen(false)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      if (isOpen) {
        handleSaveAndClose()
      } else {
        setIsOpen(true)
      }
    }
  }

  // Format the display string
  const displayStart = isOpen ? parseDateInput(localStartDate) : value.startDate
  const displayEnd = isOpen ? parseDateInput(localEndDate) : value.endDate

  const startDisplay = formatDateForDisplay(displayStart, displayFormat)
  const endDisplay = formatDateForDisplay(displayEnd, displayFormat)
  const formattedRange =
    startDisplay && endDisplay
      ? `${startDisplay} - ${endDisplay}`
      : startDisplay || endDisplay || ''

  // Get position for dropdown
  const getDropdownPosition = () => {
    if (!triggerRef.current) return { top: 0, left: 0 }
    const rect = triggerRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + 4,
      left: align === 'left' ? rect.left : rect.right,
    }
  }

  const renderTrigger = () => {
    if (hasValue) {
      if (valueTrigger) {
        return valueTrigger(value, formattedRange)
      }
      return (
        <span className={clsx('date-value', pt?.valueDisplay?.className)} {...pt?.valueDisplay}>
          {formattedRange}
        </span>
      )
    }

    if (emptyTrigger) {
      return emptyTrigger
    }

    return <Styled.DefaultEmptyTrigger icon={'calendar_add_on'} />
  }

  const position = getDropdownPosition()

  return (
    <Styled.Container
      {...pt?.root}
      className={clsx(BLOCK_DIALOG_CLOSE_CLASS, className, pt?.root?.className)}
    >
      <Styled.Trigger
        ref={triggerRef}
        onClick={handleToggle}
        disabled={disabled}
        type="button"
        {...pt?.trigger}
        className={clsx(hasValue ? 'has-value' : 'empty', pt?.trigger?.className)}
      >
        {renderTrigger()}
      </Styled.Trigger>

      {isOpen &&
        createPortal(
          <Styled.Dropdown
            ref={dropdownRef}
            style={{
              top: position.top,
              left: align === 'left' ? position.left : 'auto',
              right: align === 'right' ? window.innerWidth - position.left : 'auto',
              ...pt?.dropdown?.style,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            {...pt?.dropdown}
            className={clsx(BLOCK_DIALOG_CLOSE_CLASS, align, pt?.dropdown?.className)}
          >
            <Styled.DropdownContent className={pt?.content?.className} {...pt?.content}>
              <Styled.CloseButton
                icon="close"
                variant="text"
                onClick={handleSaveAndClose}
                {...pt?.closeButton}
              />
              <Styled.DateField
                className={pt?.startDate?.field?.className}
                {...pt?.startDate?.field}
              >
                <label {...pt?.startDate?.label}>Start date</label>
                <Styled.DateInput
                  ref={startDateInputRef}
                  type="date"
                  value={localStartDate}
                  onChange={handleStartDateChange}
                  max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
                  min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
                  onClick={(e: any) => {
                    try {
                      e.currentTarget.showPicker()
                    } catch (err) {
                      // fallback for older browsers
                    }
                  }}
                  {...pt?.startDate?.input}
                />
              </Styled.DateField>

              <Styled.DateField className={pt?.endDate?.field?.className} {...pt?.endDate?.field}>
                <label {...pt?.endDate?.label}>End date</label>
                <Styled.DateInput
                  ref={endDateInputRef}
                  type="date"
                  value={localEndDate}
                  onChange={handleEndDateChange}
                  max={maxDate ? format(maxDate, 'yyyy-MM-dd') : undefined}
                  min={localStartDate || (minDate ? format(minDate, 'yyyy-MM-dd') : undefined)}
                  onClick={(e: any) => {
                    try {
                      e.currentTarget.showPicker()
                    } catch (err) {
                      // fallback for older browsers
                    }
                  }}
                  {...pt?.endDate?.input}
                />
              </Styled.DateField>

              {hasValue && (
                <Styled.ClearButton onClick={handleClear} variant="text" {...pt?.clearButton}>
                  Clear dates
                </Styled.ClearButton>
              )}
            </Styled.DropdownContent>
          </Styled.Dropdown>,
          document.body,
        )}
    </Styled.Container>
  )
}
