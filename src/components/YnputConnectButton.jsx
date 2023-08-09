import { Button } from '@ynput/ayon-react-components'
import React from 'react'
import styled, { css } from 'styled-components'
import getShimmerStyles from '../styles/getShimmerStyles'

export const YnputConnectorButton = styled(Button)`
  background-color: var(--ayon-sys-dark-tertiary, #23e0a9);
  position: relative;
  padding: 8px 16px;
  min-height: 50px;
  max-height: unset;
  min-width: 210px;
  color: black;

  .icon {
    color: black;
    font-size: 2rem;
    font-variation-settings: 'FILL' 1;
  }

  &:hover {
    background-color: var(--ayon-sys-dark-tertiary, #23e0a9);
    /* before hover state */
    &::before {
      z-index: 0;
      content: '';
      position: absolute;
      inset: 0;
      background: var(--ayon-state-layers-dark-on-surface-opacity-016, rgba(197, 198, 201, 0.16));
    }
  }

  /* when disabled */
  ${({ $disabled }) =>
    $disabled &&
    css`
      opacity: 0.5;
    `}

  /* when loading show shimmer */
  ${({ $isLoading }) =>
    $isLoading &&
    css`
      ${getShimmerStyles('black', 'white')}
      opacity: 0.5;
    `}
`

const YnputConnectButton = React.forwardRef(({ ...props }, ref) => {
  return (
    <YnputConnectorButton
      {...props}
      ref={ref}
      $disabled={props.disabled || props.isLoading}
      $isLoading={props.isLoading}
    >
      <img src="/ynput-connect-logo.svg" />
    </YnputConnectorButton>
  )
})

YnputConnectButton.displayName = 'YnputConnectButton'

export default YnputConnectButton
