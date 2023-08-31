import React from 'react'
import PropTypes from 'prop-types'
import { Dropdown } from '@ynput/ayon-react-components'
import StatusField from './statusField'
import { useSelector } from 'react-redux'
import { uniq } from 'lodash'
import styled from 'styled-components'

const StyledDropdown = styled(Dropdown)`
  button {
    background-color: unset;
  }
`

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
  options,
  invert = false,
  ...props
}) => {
  const statusesObject = options
    ? options.reduce(
        (acc, status) => ({
          ...acc,
          [status.name]: status,
        }),
        {},
      )
    : useSelector((state) => state.project.statuses)
  const statusesOrder = useSelector((state) => state.project.statusesOrder)
  // ordered array of statuses objects
  const statuses = options || statusesOrder.map((status) => statusesObject[status])

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

  const dropdownValue = Array.isArray(value) ? uniq(value) : [value]
  const isMixed = dropdownValue.length > 1

  return (
    <StyledDropdown
      {...props}
      message={!disableMessage && multipleSelected > 1 && `${multipleSelected} Selected`}
      widthExpand={widthExpand}
      onOpen={onOpen}
      align={align}
      value={dropdownValue}
      onChange={handleChange}
      disabled={disabled}
      listInline
      valueTemplate={() => (
        <StatusField
          value={isMixed ? `Mixed Statuses` : dropdownValue[0]}
          align={align}
          size={size}
          style={{ maxWidth, ...style }}
          height={height}
          placeholder={placeholder}
          statuses={statusesObject}
          invert={invert}
          className={'value'}
        />
      )}
      dataKey={'name'}
      options={statuses}
      itemTemplate={(status, isActive) =>
        statuses.find((s) => s.name === status.name) && (
          <StatusField
            value={status.name}
            isSelecting
            isActive={!isMixed && isActive}
            align={align}
            height={height}
            statuses={statusesObject}
          />
        )
      }
    />
  )
}

StatusSelect.propTypes = {
  size: PropTypes.oneOf(['full', 'short', 'icon']),
  align: PropTypes.oneOf(['left', 'right']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.array]),
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
