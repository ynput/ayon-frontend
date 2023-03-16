import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Dropdown from '../dropdown'
import StatusField from './statusField'
import { useSelector } from 'react-redux'

const StatusSelect = ({
  value,
  size = 'full',
  maxWidth,
  height,
  align,
  onChange,
  onOpen,
  multipleSelected,
  style,
  placeholder,
  disableMessage,
  widthExpand,
}) => {
  const [changedValue, setChangedValue] = useState(null)

  const statusesObject = useSelector((state) => state.project.statuses)
  const statusesOrder = useSelector((state) => state.project.statusesOrder)
  // ordered array of statuses objects
  const statuses = statusesOrder.map((status) => statusesObject[status])

  useEffect(() => {
    if (changedValue && value === changedValue) {
      setChangedValue(null)
    }
  }, [value, changedValue, setChangedValue])

  if (!value && !placeholder) return null

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
    <>
      <Dropdown
        message={!disableMessage && multipleSelected > 1 && `${multipleSelected} Selected`}
        widthExpand={widthExpand}
        onOpen={onOpen}
        align={align}
        value={
          <StatusField
            value={changedValue || value}
            align={align}
            isChanging={!!changedValue}
            size={size}
            style={{ maxWidth, ...style }}
            height={height}
            placeholder={placeholder}
            statuses={statusesObject}
          />
        }
        options={statuses.map((status) => (
          <StatusField
            value={status.name}
            key={status.name}
            isSelecting
            isActive={value === status.name}
            onClick={() => handleChange(status.name)}
            align={align}
            height={height}
            statuses={statusesObject}
          />
        ))}
      ></Dropdown>
    </>
  )
}

StatusSelect.propTypes = {
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  align: PropTypes.oneOf(['left', 'right']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
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
  isChanged: PropTypes.object,
  disableMessage: PropTypes.bool,
}

export default StatusSelect
