import React from 'react'
import { Header } from '@tanstack/react-table'
import { Icon, Button, Dropdown } from '@ynput/ayon-react-components'
import { TableRow } from '../types/table'
import styled from 'styled-components'

const MenuButton = styled(Button)`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--md-sys-color-on-surface);
  min-width: auto;
  
  &:hover {
    background-color: var(--md-sys-color-surface-container-high);
  }
`

interface ColumnHeaderMenuProps {
  header: Header<TableRow, unknown>
  canHide?: boolean
  canPin?: boolean
  canSort?: boolean
  isResizing?: boolean
}

const ColumnHeaderMenu: React.FC<ColumnHeaderMenuProps> = ({
  header,
  canHide,
  canPin,
  canSort,
  isResizing,
}) => {
  const { column } = header
  const [selectedValue, setSelectedValue] = React.useState<string[]>([])

  const handleHide = () => {
    column.toggleVisibility()
  }

  const handlePin = (direction: 'left' | 'right' | false) => {
    column.pin(direction)
  }

  const handleSort = () => {
    column.toggleSorting()
  }

  const handleDropdownChange = (values: string[]) => {
    if (values.length > 0) {
      const action = values[0]
      switch (action) {
        case 'sort':
          handleSort()
          break
        case 'pin-left':
          handlePin('left')
          break
        case 'pin-right':
          handlePin('right')
          break
        case 'unpin':
          handlePin(false)
          break
        case 'hide':
          handleHide()
          break
      }
    }
    setSelectedValue([])
  }

  const options = []
  
  if (canSort) {
    options.push({ label: 'Sort', value: 'sort', icon: 'sort' })
  }
  
  if (canPin) {
    options.push(
      { label: 'Pin Left', value: 'pin-left', icon: 'pin_end' },
      { label: 'Pin Right', value: 'pin-right', icon: 'pin_start' }
    )
    if (column.getIsPinned()) {
      options.push({ label: 'Unpin', value: 'unpin', icon: 'unpin' })
    }
  }
  
  if (canHide) {
    options.push({ label: 'Hide Column', value: 'hide', icon: 'visibility_off' })
  }

  return (
    <Dropdown
      options={options}
      value={selectedValue}
      placeholder=""
      onChange={handleDropdownChange}
      valueTemplate={() => (
        <MenuButton disabled={isResizing}>
          <Icon icon="more_vert" />
        </MenuButton>
      )}
    />
  )
}

export default ColumnHeaderMenu
