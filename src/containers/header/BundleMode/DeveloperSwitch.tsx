import { InputSwitch } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef } from 'react'
import styled from 'styled-components'

const StyledDeveloperSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-l);
  padding: 4px 4px 4px 8px;
  margin: 4px 0;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s;
  background-color: var(--md-sys-color-surface-container-highest);

  /* default developer variant */
  --color-hl: var(--color-hl-developer);
  --color-background: var(--color-hl-developer-container);
  --color-background-hover: var(--color-hl-developer-container-hover);
  &.staging {
    --color-hl: var(--color-hl-staging);
    --color-background: var(--color-hl-staging-container);
    --color-background-hover: var(--color-hl-staging-container-hover);
  }

  & > span {
    user-select: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &.active {
    background-color: var(--color-background);

    & > span {
      color: var(--color-hl);
    }

    &:hover {
      background-color: var(--color-background-hover);
    }
  }
`

const StyledSwitch = styled(InputSwitch)`
  pointer-events: none;

  .switch-body input:checked + .slider {
    background-color: var(--color-hl);
    border-color: var(--color-hl);

    &,
    &:hover {
      &::before {
        background-color: var(--color-background);
      }
    }
  }
`

interface DeveloperSwitchProps
  extends Omit<React.HTMLAttributes<HTMLInputElement>, 'checked' | 'onChange' | 'value'> {
  value: boolean
  onChange: (value: boolean) => void
  label?: string
  variant?: 'developer' | 'staging'
}

export const DeveloperSwitch = forwardRef<HTMLInputElement, DeveloperSwitchProps>(
  ({ value, onChange, label = 'Developer Mode', variant = 'developer', ...props }, ref) => {
    const handleDeveloperMode = () => {
      onChange(!value)
    }

    return (
      <StyledDeveloperSwitch
        className={clsx({ active: value }, variant)}
        onClick={handleDeveloperMode}
      >
        <span>{label}</span>
        <StyledSwitch ref={ref} checked={value} {...props} readOnly />
      </StyledDeveloperSwitch>
    )
  },
)
