import React from 'react'
import PropTypes from 'prop-types'
import { getStatusColor } from '/src/utils'
import styled, { css, keyframes } from 'styled-components'

const hoverStyle = css`
  background-color: var(--color-grey-02);
  color: ${({ color }) => color};
`

const invertHoverStyle = css`
  /* flips the bg color for text color */
  background-color: ${({ color }) => color};
  color: black;
`

const moveDown = keyframes`
  from {
    min-height: 18px;
  }
  to {
    min-height: 29px;
  }
`

const StatusStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--base-font-size);
  position: relative;
  cursor: pointer;

  /* ICON */
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 1, 'wght' 100, 'GRAD' 200, 'opsz' 20;
    /* always taks parents color */
    color: inherit;
  }

  border-radius: var(--border-radius);
  /* same height as a row */
  height: 29px;
  min-height: 29px;

  ${({ isSelecting }) =>
    isSelecting &&
    css`
      border-radius: 0;
      height: 29px;
      min-height: 29px;
    `}

  ${({ isSelecting, isActive }) =>
    isSelecting &&
    !isActive &&
    css`
      animation: ${moveDown};
      animation-duration: 0.3s;
    `}

  /* default text color */
  color: ${({ color }) => color};

  /* sets for hover and when active whilst open (top one) */
  :hover {
    ${hoverStyle}
  }

  /* keeps the active field at the top */
  order: 2;
  ${({ isActive, isSelecting }) =>
    isActive &&
    isSelecting &&
    css`
      /* hover always on at top */
      order: 1;
      ${invertHoverStyle}

      :hover {
        ${invertHoverStyle}
      }
    `}

  /* ALIGNMENT */
    ${({ align }) =>
    align === 'right' &&
    css`
      justify-content: end;

      span {
        order: 2;
      }
    `}
`

const StatusField = ({
  value,
  valueShort,
  icon = 'radio_button_unchecked',
  isActive,
  isSelecting,
  size = 'full',
  align = 'left',
  onClick,
  style,
}) => {
  const color = getStatusColor(value)

  return (
    <StatusStyled
      style={{ ...style }}
      onClick={onClick}
      color={color}
      isActive={isActive}
      id={value}
      isSelecting={isSelecting}
      align={align}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {size !== 'icon' && (size === 'short' ? valueShort : value)}
    </StatusStyled>
  )
}

StatusField.propTypes = {
  value: PropTypes.string.isRequired,
  valueShort: PropTypes.string,
  icon: PropTypes.string,
  isActive: PropTypes.bool,
  isSelecting: PropTypes.bool,
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  align: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  style: PropTypes.object,
}

export default StatusField
