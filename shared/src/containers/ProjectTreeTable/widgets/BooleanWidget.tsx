import { forwardRef } from 'react'
import styled from 'styled-components'
import { WidgetBaseProps } from './CellWidget'

const StyledCheckbox = styled.input`
  margin: auto;
  z-index: 1;
  cursor: pointer;

  width: 16px;
  height: 16px;
  background-color: transparent;
  border: 1px solid var(--md-sys-color-outline);
  appearance: none;
  border-radius: 2px;

  &:hover {
    border-color: var(--color-table-boolean-border);
  }

  &:checked {
    background-color: var(--md-sys-color-primary);
    border-color: var(--md-sys-color-primary);
    appearance: auto;
  }
`

export interface BooleanWidgetProps
  extends Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange'>,
    WidgetBaseProps {
  value: boolean
  isReadOnly?: boolean
  isInherited?: boolean
}

export const BooleanWidget = forwardRef<HTMLInputElement, BooleanWidgetProps>(
  ({ value, onChange, isReadOnly, isEditing, onCancelEdit, isInherited, ...props }, ref) => {
    return (
      <StyledCheckbox
        {...props}
        checked={value}
        onChange={(e) => {
          const newValue = (e.target as HTMLInputElement).checked
          // For checkboxes, every click is a value change, but we check anyway for consistency
          if (newValue !== value) {
            onChange(newValue, 'Click')
          }
        }}
        ref={ref}
        type="checkbox"
        disabled={isReadOnly}
        readOnly={isReadOnly}
      />
    )
  },
)
