import { Button, ButtonProps } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef, MouseEvent } from 'react'
import styled from 'styled-components'

const StyledButton = styled(Button)`
  background-color: unset;
  color: var(--md-sys-color-tertiary);
  opacity: 0.8;
  transition: color 0.2s, background-color 0.2s, opacity 0.2s;
  border-radius: var(--border-radius-xl);

  &.border {
    border: 1px solid var(--md-sys-color-tertiary);
  }

  &:hover {
    opacity: 1;
    color: var(--md-sys-color-on-tertiary);
  }

  .icon {
    font-variation-settings: 'FILL' 1, 'wght' 200, 'GRAD' 200, 'opsz' 20;
  }
`

interface CloudButtonProps extends ButtonProps {
  featureId: string
}

export const CloudButton = forwardRef<HTMLButtonElement, CloudButtonProps>(
  ({ featureId, ...props }, ref) => {
    const handleOnClick = (e: MouseEvent<HTMLButtonElement>) => {
      // open a dialog to subscribe to Ynput Cloud
      window.alert(`Subscribe to Ynput Cloud to use the ${featureId} feature`)
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
        className={clsx('cloud-button', props.className || '', { border: !!props.children })}
      >
        {props.children}
      </StyledButton>
    )
  },
)
