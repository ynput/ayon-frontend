import React from 'react'
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
  const statusesObject = useSelector((state) => state.project.statuses)
  const statusesOrder = useSelector((state) => state.project.statusesOrder)
  // ordered array of statuses objects
  const statuses = statusesOrder.map((status) => statusesObject[status])

  if (!value && !placeholder) return null

  const handleChange = (status) => {
    if (status[0] === value || !status?.length) return
    onChange(status[0])
  }

  // calculate max width based off longest status name
  const charWidth = 7
  const gap = 5
  const iconWidth = 20
  const longestStatus = [...statuses].sort((a, b) => b.name.length - a.name.length)[0].name.length
  const calcMaxWidth = longestStatus * charWidth + gap + iconWidth + 16

  maxWidth = maxWidth || calcMaxWidth

  return (
    <Dropdown
      message={!disableMessage && multipleSelected > 1 && `${multipleSelected} Selected`}
      widthExpand={widthExpand}
      onOpen={onOpen}
      align={align}
      value={[value]}
      onChange={handleChange}
      valueItem={() => (
        <StatusField
          value={value}
          align={align}
          size={size}
          style={{ maxWidth, ...style }}
          height={height}
          placeholder={placeholder}
          statuses={statusesObject}
        />
      )}
      valueField={'name'}
      options={statuses}
      optionsItem={(status, isActive) => (
        <StatusField
          value={status.name}
          isSelecting
          isActive={isActive}
          align={align}
          height={height}
          statuses={statusesObject}
        />
      )}
    />
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
