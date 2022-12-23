import React from 'react'
import PropTypes from 'prop-types'
import { getStatusColor } from '/src/utils'
import styled from 'styled-components'

const ContainerStyled = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--base-font-size);
  /* same height as a row */
  height: ${(props) => (props.isSelecting ? '29px' : '23px')};

  position: relative;

  cursor: pointer;

  color: ${(props) => props.color};

  :hover {
    background-color: ${(props) =>
      props.isSelecting ? (props.isActive ? props.color : 'var(--color-grey-02)') : props.color};
    color: ${(props) => (props.isSelecting ? props.color : 'black')};

    .material-symbols-outlined {
      color: ${(props) => (props.isSelecting ? 'unset' : 'black')};
    }
  }

  border-radius: var(--border-radius);

  .material-symbols-outlined {
    font-variation-settings: 'FILL' 1, 'wght' 100, 'GRAD' 200, 'opsz' 20;
    color: ${(props) => props.color};
  }

  /* when open and active set hover state */
  background-color: ${(props) =>
    props.isSelecting ? (props.isActive ? props.color : 'var(--color-grey-02)') : 'unset'};
  color: ${(props) => (props.isSelecting ? (props.isActive ? 'black' : props.color) : 'unset')};

  order: ${(props) => (props.isActive ? 0 : 1)};
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
