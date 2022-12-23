import React from 'react'
import PropTypes from 'prop-types'
import Dropdown from '../dropDown'
import StatusField from './statusField'

const StatusSelect = ({ value, statuses = [], size = 'full', width = 150, height }) => {
  if (!value) return null

  const handleChange = (name) => {
    console.log(name)
  }

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
              onClick={() => handleChange(status.name)}
            />
          ))
        ) : (
          <StatusField value={value} />
        )
      }
    </Dropdown>
  )
}

StatusSelect.propTypes = {
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  value: PropTypes.string,
  statuses: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      state: PropTypes.string.isRequired,
    }).isRequired,
  ),
}

export default StatusSelect
