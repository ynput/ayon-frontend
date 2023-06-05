import React from 'react'
import PropTypes from 'prop-types'
import { Dropdown } from '@ynput/ayon-react-components'
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
  disabled,
  widthExpand,
}) => {
  const statusesObject = useSelector((state) => state.project.statuses)
  const statusesOrder = useSelector((state) => state.project.statusesOrder)
  // ordered array of statuses objects
  const statuses = statusesOrder.map((status) => statusesObject[status])

  if (!value && !placeholder) return null

  const handleChange = (status) => {
    if (!status?.length) return
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
      disabled={disabled}
      valueTemplate={() => (
        <StatusField
          value={Array.isArray(value) ? `Multiple ( ${value.join(', ')} )` : value}
          align={align}
          size={size}
          style={{ maxWidth, ...style }}
          height={height}
          placeholder={placeholder}
          statuses={statusesObject}
        />
      )}
      dataKey={'name'}
      options={statuses}
      itemTemplate={(status, isActive) => (
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
  disabled: PropTypes.bool,
  widthExpand: PropTypes.bool,
}

export default StatusSelect
