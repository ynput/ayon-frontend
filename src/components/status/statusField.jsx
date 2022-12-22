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
  height: 29px;
  cursor: pointer;

  .material-symbols-outlined {
    font-variation-settings: 'FILL' 1, 'wght' 100, 'GRAD' 200, 'opsz' 20;
  }

  order: ${(props) => (props.isActive ? 0 : 1)};
`

const StatusField = ({
  value,
  icon = 'radio_button_unchecked',
  isActive,
  isSelecting,
  size,
  onClick,
  style,
}) => {
  const color = getStatusColor(value)

  return (
    <ContainerStyled style={{ ...style, color }} onClick={onClick} isActive={isActive} id={value}>
      <span className="material-symbols-outlined" style={{ color }}>
        {icon}
      </span>
      {value}
    </ContainerStyled>
  )
}

StatusField.propTypes = {
  value: PropTypes.string.isRequired,
  icon: PropTypes.string,
  isActive: PropTypes.bool,
  isSelecting: PropTypes.bool,
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  onClick: PropTypes.func,
}

export default StatusField
