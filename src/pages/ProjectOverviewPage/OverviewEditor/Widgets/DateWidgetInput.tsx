import { forwardRef, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { format, isValid, parseISO } from 'date-fns'

interface DateWidgetInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onCancel?: () => void
  onChange: (value: string) => void
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
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus()
      }
    }, [autoFocus])

    const handleBlur = () => {
      if (value) {
        const parsedDate = parseISO(value)
        if (isValid(parsedDate)) {
          onChange(format(parsedDate, 'yyyy-MM-dd'))
        } else {
          onCancel?.()
        }
      } else {
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
      />
    )
  },
)
