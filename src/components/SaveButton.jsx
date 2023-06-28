import React from 'react'
import PropTypes from 'prop-types'
import styled, { css, keyframes } from 'styled-components'
import { Button } from '@ynput/ayon-react-components'

// spin animation
const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`

const StyledSaveButton = styled(Button)`
  transition: background-color 0.3s;
  /* active styles */
  ${({ $active }) =>
    $active &&
    css`
      transition: background-color 0s;

      background-color: var(--color-hl-00);
      color: black;

      .icon {
        color: black;

        /* saving spine icon */
        ${({ $saving }) =>
          $saving &&
          css`
            animation: ${spin} 1s linear infinite;
            cursor: not-allowed;
            user-select: none;
          `}
      }

      &:hover {
        background-color: #76cbe8;
      }
    `}
`
const SaveButton = React.forwardRef(({ active, saving, children, ...props }, ref) => {
  return (
    <StyledSaveButton
      ref={ref}
      disabled={!active}
      icon={props?.icon || saving ? 'sync' : 'check'}
      {...props}
      $active={active}
      $saving={saving}
    >
      {children}
    </StyledSaveButton>
  )
})

SaveButton.displayName = 'SaveButton'

SaveButton.propTypes = {
  active: PropTypes.bool,
  saving: PropTypes.bool,
}

export default SaveButton
