import React from 'react'
import PropTypes from 'prop-types'
import { getStatusColor } from '/src/utils'
import styled, { css } from 'styled-components'

const hoverStyle = css`
  /* flips the bg color for text color */
  background-color: ${({ color }) => color};
  color: black;
`

const ContainerStyled = styled.div`
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
  height: 23px;

  ${({ isSelecting }) =>
    isSelecting &&
    css`
      border-radius: 0;
      height: 29px;
    `}

  /* default text color */
  color: ${({ color }) => color};

  /* keeps the active field at the top */
  order: 2;
  ${({ isActive, isSelecting }) =>
    isActive &&
    isSelecting &&
    css`
      /* hover always on at top */
      order: 1;
      ${hoverStyle}
    `}

  /* sets for hover and when active whilst open (top one) */
  :hover {
    ${hoverStyle}

    /* set hover styles for when open */
    ${({ isActive, isSelecting }) =>
      !isActive &&
      isSelecting &&
      css`
        /* hover always on at top */
        background-color: var(--color-grey-02);
        color: ${({ color }) => color};
      `}
  }
`

const StatusField = ({
  value,
  valueShort,
  icon = 'radio_button_unchecked',
  isActive,
  isSelecting,
  size = 'full',
  onClick,
  style,
}) => {
  const color = getStatusColor(value)

  return (
    <ContainerStyled
      style={{ ...style }}
      onClick={onClick}
      color={color}
      isActive={isActive}
      id={value}
      isSelecting={isSelecting}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {size !== 'icon' && (size === 'short' ? valueShort : value)}
    </ContainerStyled>
  )
}

StatusField.propTypes = {
  value: PropTypes.string.isRequired,
  valueShort: PropTypes.string,
  icon: PropTypes.string,
  isActive: PropTypes.bool,
  isSelecting: PropTypes.bool,
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  onClick: PropTypes.func,
}

export default StatusField
