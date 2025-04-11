import { forwardRef, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { format, isValid, parseISO } from 'date-fns'
import { WidgetBaseProps } from './CellWidget'

interface DateWidgetInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>,
    WidgetBaseProps {
  value: string
  onCancel?: () => void
  autoFocus?: boolean
}

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
  background-color: transparent;
  width: 100%;
  box-sizing: border-box;
`

export const DateWidgetInput = forwardRef<HTMLInputElement, DateWidgetInputProps>(
  ({ value: initialValue, onChange, onCancel, autoFocus = true, ...props }, _) => {
    const [value, setValue] = useState(() => {
      if (initialValue) {
        const parsedDate = parseISO(initialValue)
        if (isValid(parsedDate)) {
          return format(parsedDate, 'yyyy-MM-dd')
        }
      }
      return ''
    })

    useEffect(() => {
      if (initialValue) {
        const parsedDate = parseISO(initialValue)
        if (isValid(parsedDate)) {
          setValue(format(parsedDate, 'yyyy-MM-dd'))
        } else {
          setValue('')
        }
      }
    }, [initialValue])

    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus()
        // Delay showPicker call until after focus to ensure it's tied to user interaction
        setTimeout(() => {
          try {
            inputRef.current?.showPicker()
          } catch (error) {
            console.debug('Date picker could not be shown automatically:', error)
          }
        }, 100)
      }
    }, [autoFocus])

    // Ensure the picker opens when clicked directly
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      e.preventDefault() // Prevent default to ensure our handler takes precedence
      try {
        inputRef.current?.showPicker()
      } catch (error) {
        console.debug('Date picker could not be shown on click:', error)
      }
    }

    const handleDateSubmit = (event?: 'Click' | 'Enter') => {
      if (value) {
        const parsed = Date.parse(value)
        if (isValid(parsed)) {
          const dateWithZeroTime = new Date(parsed)
          dateWithZeroTime.setUTCHours(0, 0, 0, 0)
          onChange(dateWithZeroTime.toISOString(), event)
          return true
        }
      }
      return false
    }

    const handleBlur = () => {
      if (!handleDateSubmit('Click')) {
        onCancel?.()
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleDateSubmit('Enter')
        inputRef.current?.blur()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
      }
    }

    return (
      <StyledInput
        {...props}
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />
    )
  },
)
