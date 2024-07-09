import React from 'react'
import PropTypes from 'prop-types'
import { Button } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'

const StyledChevron = styled(Button)`
  background-color: transparent;
  max-width: 30px;

  .icon {
    transition: rotate 0.15s ease-in-out;

    /* set rotate based on isOpen and side */
    ${({ $side, $isOpen }) => {
      let angle = $isOpen ? 0 : 180
      switch ($side) {
        case 'top':
          angle += 0
          break
        case 'bottom':
          angle += 180
          break
        case 'right':
          angle += 90
          break
        case 'left':
          angle += 270
          break
        default:
          angle += 0
          break
      }

      return css`
        rotate: ${angle}deg;
      `
    }}
  }
`

const CollapseButton = ({ onClick, side = 'left', isOpen, style, className, ...props }) => {
  return (
    <StyledChevron
      onClick={onClick}
      icon={'expand_less'}
      $side={side}
      $isOpen={isOpen}
      style={style}
      className={'collapse-button ' + className}
      {...props}
    />
  )
}

CollapseButton.propTypes = {
  onClick: PropTypes.func,
  side: PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  isOpen: PropTypes.bool,
}

export default CollapseButton
