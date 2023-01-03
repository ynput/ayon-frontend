import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Dropdown from '../dropdown'
import StatusField from './statusField'

const StatusSelect = ({
  value,
  statuses = [],
  size = 'full',
  maxWidth,
  height,
  align,
  onChange,
  multipleSelected,
  onClick,
}) => {
  const [changedValue, setChangedValue] = useState(null)

  useEffect(() => {
    if (changedValue && value === changedValue) {
      setChangedValue(null)
    }
  }, [value, changedValue, setChangedValue])

  if (!value) return null

  const handleChange = (status) => {
    if (status === value) return
    onChange(status)

    // creates a highlighted effect of new
    setChangedValue(status)
  }

  // calculate max width based off longest status name
  const charWidth = 7
  const gap = 5
  const iconWidth = 20
  const longestStatus = [...statuses].sort((a, b) => b.name.length - a.name.length)[0].name.length
  const calcMaxWidth = longestStatus * charWidth + gap + iconWidth

  maxWidth = maxWidth || calcMaxWidth

  return (
    <Dropdown
      value={value}
      options={statuses}
      style={{ maxWidth, height }}
      message={multipleSelected > 1 && `${multipleSelected} Selected`}
      onOpen={onClick}
    >
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
              align={align}
            />
          ))
        ) : (
          <StatusField
            value={changedValue || value}
            align={align}
            isChanging={!!changedValue}
            size={size}
          />
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
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  multipleSelected: PropTypes.number,
  onClick: PropTypes.func,
}

export default StatusSelect
