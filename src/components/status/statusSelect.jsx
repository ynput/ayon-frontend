import React from 'react'
import { Dropdown } from '@ynput/ayon-react-components'
import StatusField from './statusField'
import { useSelector } from 'react-redux'
import { uniq } from 'lodash'
import styled from 'styled-components'

const StyledDropdown = styled(Dropdown)`
  button {
    background-color: unset;
  }
  display: flex;
`

const StatusSelect = ({
  value,
  size = 'full',
  maxWidth,
  height = 30,
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
  isChanged,
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
  const statusesSortedByLength = [...statuses].sort((a, b) => b.name.length - a.name.length)[0]
  const longestStatus = statusesSortedByLength?.name?.length
  const calcMaxWidth = longestStatus * charWidth + gap + iconWidth + 16

  maxWidth = maxWidth || calcMaxWidth || 'unset'

  const dropdownValue = Array.isArray(value) ? uniq(value) : [value]
  const isMixed = dropdownValue.length > 1

  return (
    <StyledDropdown
      {...props}
      message={!disableMessage && multipleSelected > 1 && `${multipleSelected} Selected`}
      messageOverButton
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
          size={size}
          style={{ maxWidth, ...style }}
          height={height}
          placeholder={placeholder}
          statuses={statusesObject}
          invert={invert}
          className={'value'}
          isChanged={isChanged}
        />
      )}
      dataKey={'name'}
      options={statuses}
      itemTemplate={(status, isActive) =>
        statuses.find((s) => s.name === status.name) && (
          <StatusField
            value={status.name}
            isSelecting
            isActive={isActive}
            height={height}
            statuses={statusesObject}
          />
        )
      }
    />
  )
}

export default StatusSelect
