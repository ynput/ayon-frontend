import { Button } from '@ynput/ayon-react-components'
import React from 'react'
import styled from 'styled-components'

const StyledButton = styled(Button)`
  background-color: var(--ayon-sys-dark-tertiary, #23e0a9);
  position: relative;

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
`

const YnputConnect = React.forwardRef(({ ...props }, ref) => {
  return (
    <StyledButton {...props} ref={ref}>
      <img src="/ynput-connect-logo.svg" />
    </StyledButton>
  )
})

YnputConnect.displayName = 'YnputConnect'

export default YnputConnect
