import { Dropdown, Icon } from '@ynput/ayon-react-components'
import { useState } from 'react'
import styled from 'styled-components'
import { Header } from '@tanstack/react-table'
import type { TableRow } from '../types/table'

const MenuItem = styled.div<{ isFirst?: boolean; isLast?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${({ isFirst, isLast }) =>
    `${isFirst ? '16px' : '8px'} 12px ${isLast ? '16px' : '8px'}`};
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
  divider?: boolean
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
  const [isOpen, setIsOpen] = useState(false)

  // Hide the menu when resizing
  if (isResizing) {
    return null
  }

  const menuOptions: MenuOption[] = []

  if (canPin) {
    const isPinned = column.getIsPinned() === 'left'
    menuOptions.push({
      value: 'pin',
      label: isPinned ? 'Unpin column' : 'Pin column',
      icon: 'push_pin',
    })
  }

  if (canPin && canSort) {
    menuOptions.push({
      value: 'divider1',
      label: '',
      icon: '',
      divider: true,
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
      divider: true,
    })
  }

  if (canHide) {
    menuOptions.push({
      value: 'hide',
      label: column.getIsVisible() ? 'Hide column' : 'Show column',
      icon: column.getIsVisible() ? 'visibility_off' : 'visibility',
    })
  }

  if (menuOptions.length === 0) {
    return null
  }

  const handleMenuChange = (value: string[]) => {
    const selectedValue = value[0]

    if (selectedValue === 'hide') {
      column.getToggleVisibilityHandler()({} as any)
    } else if (selectedValue === 'pin') {
      const isPinned = column.getIsPinned() === 'left'
      if (isPinned) {
        column.pin(false)
      } else {
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
      listStyle={{
        minWidth: '160px',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      placeholder=""
      itemTemplate={(option) => {
        if (option.divider) {
          return (
            <hr
              style={{
                margin: '0 8px',
                border: 'none',
                borderTop: '1px solid var(--md-sys-color-surface-container)',
                height: '1px',
              }}
            />
          )
        }

        const menuItems = menuOptions.filter((opt) => !opt.divider)
        const menuItemIndex = menuItems.findIndex((item) => item.value === option.value)
        const isFirst = menuItemIndex === 0
        const isLast = menuItemIndex === menuItems.length - 1

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
