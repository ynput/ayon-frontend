import { PowerpackFeature, usePowerpack } from '@shared/context'
import { Button, ButtonProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef, MouseEvent } from 'react'
import styled from 'styled-components'

const StyledButton = styled(Button)`
  background-color: unset !important;
  color: var(--md-sys-color-tertiary);
  transition: color 0.2s, background-color 0.2s, opacity 0.2s;
  border-radius: var(--border-radius-xl);

  &.filled {
    background-color: var(--md-sys-color-tertiary) !important;
    color: var(--md-sys-color-on-tertiary);
  }

  &.border {
    border: 1px solid var(--md-sys-color-tertiary);
  }

  &:hover {
    color: var(--md-sys-color-on-tertiary);
  }

  .icon {
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }
`

export interface PowerpackButtonProps extends ButtonProps {
  feature: PowerpackFeature
  filled?: boolean
}

export const PowerpackButton = forwardRef<HTMLButtonElement, PowerpackButtonProps>(
  ({ feature, filled, ...props }, ref) => {
    const { setPowerpackDialog } = usePowerpack()

    const handleOnClick = (e: MouseEvent<HTMLButtonElement>) => {
      // open a dialog to subscribe to Ynput Cloud
      setPowerpackDialog(feature)
      // Call the original onClick handler
      props.onClick?.(e)
    }

    return (
      <StyledButton
        variant={props.variant || 'tertiary'}
        icon={props.icon || 'bolt'}
        {...props}
        ref={ref}
        onClick={handleOnClick}
        className={clsx('cloud-button', props.className || '', {
          border: !!props.children,
          filled,
        })}
        data-tooltip={`Power feature`}
        data-tooltip-delay={0}
      >
        {props.children}
      </StyledButton>
    )
  },
)
