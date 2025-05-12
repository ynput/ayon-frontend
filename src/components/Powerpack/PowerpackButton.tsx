import { PowerpackFeature, usePowerpack } from '@context/PowerpackContext'
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
  feature: PowerpackFeature
}

const PowerpackButton = forwardRef<HTMLButtonElement, CloudButtonProps>(
  ({ feature, ...props }, ref) => {
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
        className={clsx('cloud-button', props.className || '', { border: !!props.children })}
        data-tooltip={`Power feature`}
        data-tooltip-delay={0}
      >
        {props.children}
      </StyledButton>
    )
  },
)

export default PowerpackButton
