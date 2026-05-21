import { PowerpackFeature, usePowerpack } from '@shared/context'
import { Button, ButtonProps, Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { forwardRef, MouseEvent } from 'react'
import styled from 'styled-components'

const StyledButton = styled(Button)`
  transition: color 0.2s, background-color 0.2s, opacity 0.2s;

  .bolt {
    color: var(--md-sys-color-tertiary);
  }

  &.outline {
    color: var(--md-sys-color-tertiary);
    background-color: unset !important;
    border: 1px solid var(--md-sys-color-tertiary);
    &:hover {
      color: var(--md-sys-color-on-tertiary);
    }
  }

  &.filled {
    color: var(--md-sys-color-tertiary);
    background-color: var(--md-sys-color-tertiary) !important;
    color: var(--md-sys-color-on-tertiary);

    .bolt {
      color: var(--md-sys-color-on-tertiary);
    }

    &:hover {
      color: var(--md-sys-color-on-tertiary);
    }
  }

  &.rounded {
    border-radius: var(--border-radius-xl);
  }
`

export interface PowerpackButtonProps extends Omit<ButtonProps, 'variant'> {
  feature: PowerpackFeature
  variant?: 'filled' | 'surface' | 'outline'
  rounded?: boolean
  bolt?: boolean
}

export const PowerpackButton = forwardRef<HTMLButtonElement, PowerpackButtonProps>(
  ({ feature, variant = 'outline', rounded = true, bolt = false, ...props }, ref) => {
    const { setPowerpackDialog } = usePowerpack()

    const handleOnClick = (e: MouseEvent<HTMLButtonElement>) => {
      // open a dialog to subscribe to Ynput Cloud
      setPowerpackDialog(feature)
      // Call the original onClick handler
      props.onClick?.(e)
    }

    return (
      <StyledButton
        icon={props.icon || 'bolt'}
        {...props}
        ref={ref}
        onClick={handleOnClick}
        iconProps={{
          filled: variant === 'filled',
        }}
        className={clsx('cloud-button', props.className, { rounded })}
        data-tooltip={`Power feature`}
        data-tooltip-delay={0}
      >
        {props.children}
        {bolt && <Icon icon="bolt" filled className="bolt" />}
      </StyledButton>
    )
  },
)
