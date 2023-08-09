import { Button } from '@ynput/ayon-react-components'
import React from 'react'
import styled, { css } from 'styled-components'
import getShimmerStyles from '../styles/getShimmerStyles'

export const YnputConnectorButton = styled(Button)`
  background-color: var(--md-sys-color-tertiary);
  position: relative;
  padding: 8px 16px;
  min-height: 50px;
  max-height: unset;
  min-width: 210px;
  color: var(--md-sys-color-on-tertiary);

  .icon {
    color: var(--md-sys-color-on-tertiary);
    font-size: 2rem;
    font-variation-settings: 'FILL' 1;
  }

  &:hover {
    background-color: var(--md-sys-color-tertiary-hover);
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
