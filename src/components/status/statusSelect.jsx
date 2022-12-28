import React from 'react'
import PropTypes from 'prop-types'
import Dropdown from '../dropDown'
import StatusField from './statusField'

const StatusSelect = ({
  value,
  statuses = [],
  size = 'full',
  width = 150,
  height,
  align,
  onChange,
}) => {
  if (!value) return null

  return (
    <Dropdown value={value} options={statuses} style={{ width, height }}>
      {(props) =>
        props.isOpen ? (
          statuses.map((status) => (
            <StatusField
              value={status.name}
              key={status.name}
              size={size}
              isSelecting
              isActive={props.selected === status.name}
              onClick={() => onChange(status.name)}
              align={align}
            />
          ))
        ) : (
          <StatusField value={value} align={align} />
        )
      }
    </Dropdown>
  )
}

StatusSelect.propTypes = {
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  align: PropTypes.oneOf(['left', 'right']),
  value: PropTypes.string,
  statuses: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      state: PropTypes.string.isRequired,
    }).isRequired,
  ),
  onChange: PropTypes.func.isRequired,
}

export default StatusSelect
