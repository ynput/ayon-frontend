import { forwardRef, KeyboardEvent, useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { WidgetBaseProps } from './CellWidget'
import { TextWidgetType } from './TextWidget'
import { toast } from 'react-toastify'

interface TextWidgetInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onCancel?: () => void
  onChange: WidgetBaseProps['onChange']
  autoFocus?: boolean
  type?: TextWidgetType
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
  ({ value: initialValue, onChange, onCancel, autoFocus = true, type = 'string', ...props }, _) => {
    // Local state to manage input value
    const [value, setValue] = useState(initialValue)
    const inputRef = useRef<HTMLInputElement>(null)
    const escapePressed = useRef(false)

    const originalValue = useRef(initialValue)

    // Helper function to validate and convert value based on type
    const validateAndConvertValue = (inputValue?: string): any => {
      // convert inputValue to string for consistent processing
      const inputStr =
        inputValue !== undefined && inputValue !== null ? String(inputValue).trim() : ''
      if (!inputValue) return ''

      // Handle empty values
      if (inputStr === '') {
        return type === 'string' ? '' : null
      }

      switch (type) {
        case 'integer':
          const intValue = parseInt(inputStr, 10)
          return isNaN(intValue) ? null : intValue
        case 'float':
          const floatValue = parseFloat(inputStr)
          return isNaN(floatValue) ? null : floatValue
        case 'string':
          return inputStr
        default:
          return inputStr
      }
    }

    // Helper function to check if the value has actually changed
    const hasValueChanged = (newValue: any): boolean => {
      const original = originalValue.current

      // For non-string types, treat empty values (null, undefined, empty string) as equivalent
      if (type !== 'string') {
        const newIsEmpty = newValue === null || newValue === undefined || newValue === ''
        const originalIsEmpty = original === null || original === undefined || original === ''

        if (newIsEmpty && originalIsEmpty) {
          return false
        }

        if (newIsEmpty !== originalIsEmpty) {
          return true
        }
      }

      return newValue !== original
    }

    // Set focus on the input when component mounts
    useEffect(() => {
      if (autoFocus && inputRef && inputRef.current) {
        inputRef.current.focus()
        // position cursor at the end of text
        inputRef.current.select()
      }
    }, [autoFocus])

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const validatedValue = validateAndConvertValue(value)

        // Always trigger onChange on Enter, even if value hasn't changed
        if (type === 'string' || validatedValue !== null) {
          onChange(validatedValue, 'Enter')
        } else {
          const fieldTypeLabel = type === 'integer' ? 'integer' : 'number'
          toast.error(`Invalid ${fieldTypeLabel} value. Please enter a valid ${fieldTypeLabel}.`)
          onCancel?.()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        escapePressed.current = true
        onCancel?.()
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.relatedTarget?.tagName === 'INPUT') {
        return
      }

      if (!escapePressed.current) {
        const validatedValue = validateAndConvertValue(value)

        if (!hasValueChanged(validatedValue)) {
          onCancel?.()
          return
        }

        if (type === 'string' || validatedValue !== null) {
          onChange(validatedValue, 'Click')
        } else {
          const fieldTypeLabel = type === 'integer' ? 'integer' : 'number'
          toast.error(`Invalid ${fieldTypeLabel} value. Please enter a valid ${fieldTypeLabel}.`)
        }
      }

      // Reset the flag
      escapePressed.current = false
    }

    return (
      <StyledInput
        {...props}
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    )
  },
)
