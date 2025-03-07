import { forwardRef } from 'react'
import styled from 'styled-components'

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
    border-color: hsl(212.31deg 16.83% 74.65%);
  }

  &:checked {
    background-color: var(--md-sys-color-primary);
    border-color: var(--md-sys-color-primary);
    appearance: auto;
  }
`

interface BooleanWidgetProps extends Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: boolean
  onChange: (value: boolean) => void
}

export const BooleanWidget = forwardRef<HTMLInputElement, BooleanWidgetProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <StyledCheckbox
        {...props}
        checked={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
        ref={ref}
        type="checkbox"
      />
    )
  },
)
