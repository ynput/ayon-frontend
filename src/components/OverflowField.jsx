import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import copyToClipboard from '../helpers/copyToClipboard'

const OverflowFieldStyled = styled.div`
  position: relative;

  width: 100%;
  display: flex;
  justify-content: ${({ align }) => (align === 'left' ? 'flex-start' : 'flex-end')};
  overflow-x: clip;

  span:first-child {
    white-space: nowrap;
  }

  ${({ isNode }) =>
    !isNode &&
    css`
      margin-right: 4px;
    `}
`

const OverflowStringStyled = styled.span`
  /* overflow */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
  padding: 0 3px;
`

const RevealStringStyled = styled.span`
  position: absolute;
  background-color: var(--color-grey-01);
  border-radius: 3px;
  right: ${({ align }) => (align === 'left' ? 'unset' : 0)};
  left: ${({ align }) => (align === 'left' ? 0 : 'unset')};
  word-break: break-all;
  cursor: pointer;
  max-width: 100%;
  z-index: 10;

  transition: height 0.2s;
  overflow-y: hidden;
  height: 18px;

  opacity: 0;
  padding: 0 3px;

  :hover {
    opacity: 1;
    height: auto;
    box-shadow: 0 0 8px 0 rgb(0 0 0 / 20%);
    transition: opacity 0.2s;
  }
`

const OverflowField = ({ value = '', style, align = 'right' }) => {
  let isNode
  // check if value if $$typeof: Symbol(react.element)

  if (value && typeof value === 'object' && !Array.isArray(value) && value.$$typeof) {
    isNode = true
  }

  return (
    <OverflowFieldStyled style={style} align={align} isNode={isNode}>
      {isNode ? value : <OverflowStringStyled>{value}</OverflowStringStyled>}
      {!isNode && (
        <RevealStringStyled onClick={() => copyToClipboard(value)} align={align}>
          {value}
        </RevealStringStyled>
      )}
    </OverflowFieldStyled>
  )
}

OverflowField.propTypes = {
  value: PropTypes.any,
  align: PropTypes.oneOf(['left', 'right']),
}

export default OverflowField
