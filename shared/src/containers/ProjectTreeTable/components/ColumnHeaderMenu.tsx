import { Dropdown, Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { Header } from '@tanstack/react-table'
import type { TableRow } from '../types/table'

const MenuItem = styled.div<{ isFirst?: boolean; isLast?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: var(--md-sys-color-surface-container);
  }

  .icon {
    font-size: 16px;
    color: var(--md-sys-color-on-surface);
  }

  span {
    font-size: 14px;
    color: var(--md-sys-color-on-surface);
  }
`

const Divider = styled.div`
  height: 1px;
  background-color: #41474D;
`

const StyledDropdown = styled(Dropdown)`
  height: 24px;
  width: 24px;

  button {
    background-color: transparent;
    border: none;
    padding: 0;
    min-height: 24px;
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: var(--md-sys-color-surface-container);
    }

    & > div {
      border: none;
      padding: 0;
      gap: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .icon {
    font-size: 16px;
    color: var(--md-sys-color-on-surface);
  }
`

interface MenuOption {
  value: string
  label: string
  icon: string
}

interface ColumnHeaderMenuProps {
  header: Header<TableRow, unknown>
  canHide?: boolean
  canPin?: boolean
  canSort?: boolean
  isResizing?: boolean
}

export const ColumnHeaderMenu = ({
  header,
  canHide,
  canPin,
  canSort,
  isResizing,
}: ColumnHeaderMenuProps) => {
  const { column } = header

  // Hide the menu when resizing
  if (isResizing) {
    return null
  }

  // Get current column state - we need to call these methods directly to get fresh state
  const isPinned = column.getIsPinned()
  const isVisible = column.getIsVisible()

  const menuOptions: MenuOption[] = []

  if (canPin) {
    const isPinnedLeft = isPinned === 'left'
    menuOptions.push({
      value: 'pin',
      label: isPinnedLeft ? 'Unpin column' : 'Pin column',
      icon: 'push_pin',
    })
  }

  if (canPin && canSort) {
    menuOptions.push({
      value: 'divider1',
      label: '',
      icon: '',
    })
  }

  if (canSort) {
    menuOptions.push({
      value: 'sort-asc',
      label: 'Sort ascending',
      icon: 'sort',
    })

    menuOptions.push({
      value: 'sort-desc',
      label: 'Sort descending',
      icon: 'sort',
    })
  }

  if (canSort && canHide) {
    menuOptions.push({
      value: 'divider2',
      label: '',
      icon: '',
    })
  }

  if (canHide) {
    menuOptions.push({
      value: 'hide',
      label: isVisible ? 'Hide column' : 'Show column',
      icon: isVisible ? 'visibility_off' : 'visibility',
    })
  }

  if (menuOptions.length === 0) {
    return null
  }

  const handleMenuChange = (value: string[]) => {
    const selectedValue = value[0]

    if (selectedValue === 'hide') {
      // Toggle column visibility directly
      column.toggleVisibility()
    } else if (selectedValue === 'pin') {
      const isPinnedLeft = isPinned === 'left'
      if (isPinnedLeft) {
        // Unpin the column
        column.pin(false)
      } else {
        // Pin the column to the left
        column.pin('left')
      }
    } else if (selectedValue === 'sort-asc') {
      column.toggleSorting(false) // false for ascending
    } else if (selectedValue === 'sort-desc') {
      column.toggleSorting(true) // true for descending
    }
  }

  return (
    <StyledDropdown
      value={[]}
      options={menuOptions}
      onChange={handleMenuChange}
      dropIcon="more_horiz"
      multiSelect={false}
      listStyle={{
        minWidth: '160px',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
      }}
      placeholder=""
      itemTemplate={(option) => {
        // Check if this is a divider
        if (option.value.startsWith('divider')) {
          return <Divider />
        }

        const menuItemIndex = menuOptions.findIndex((item) => item.value === option.value)
        const isFirst = menuItemIndex === 0
        const isLast = menuItemIndex === menuOptions.length - 1

        return (
          <MenuItem isFirst={isFirst} isLast={isLast}>
            <Icon icon={option.icon} />
            <span>{option.label}</span>
          </MenuItem>
        )
      }}
    />
  )
}
