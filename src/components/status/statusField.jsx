import React from 'react'
import PropTypes from 'prop-types'
import { getStatusColor } from '/src/utils'
import styled from 'styled-components'

const ContainerStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--base-font-size);
  border-radius: var(--border-radius);
  /* same height as a row */
  height: ${(props) => (props.isSelecting ? '29px' : '23px')};

  position: relative;

  cursor: pointer;

  /* ICON */
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 1, 'wght' 100, 'GRAD' 200, 'opsz' 20;
    /* always taks parents color */
    color: inherit;
  }

  /* keeps the active field at the top */
  order: 2;
  &.isActive.isSelecting {
    order: 1;
  }

  &:not(:hover) {
    /* text color when not hovering */
    color: ${({ color }) => color};
  }

  /* sets for hover and when active whilst open (top one) */
  :hover,
  &.isActive.isSelecting {
    /* flips the bg color for text color */
    background-color: ${({ color }) => color};
    color: black;
  }

  /* set hover styles for when open */
  /* overrides hover when closed */
  &.isSelecting.notActive:hover {
    background-color: var(--color-grey-02);
    color: ${({ color }) => color};
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
      className={`${isActive ? 'isActive' : 'notActive'} ${
        isSelecting ? 'isSelecting' : 'notSelecting'
      }`}
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
