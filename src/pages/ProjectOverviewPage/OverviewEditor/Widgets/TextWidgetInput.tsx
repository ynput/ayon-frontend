import { forwardRef, KeyboardEvent, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'

interface TextWidgetInputProps
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

export const TextWidgetInput = forwardRef<HTMLInputElement, TextWidgetInputProps>(
  ({ value: initialValue, onChange, onCancel, autoFocus = true, ...props }, _) => {
    // Local state to manage input value
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLInputElement>(null)

    // Set focus on the input when component mounts
    useEffect(() => {
      if (autoFocus && inputRef && inputRef.current) {
        inputRef.current.focus()
        // position cursor at the end of text
        if (inputRef.current.type !== 'number') {
          inputRef.current.selectionStart = inputRef.current.value.length
        }
      }
    }, [autoFocus])

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onChange(value)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
      }
    }

    return (
      <StyledInput
        {...props}
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onChange(value)}
      />
    )
  },
)
