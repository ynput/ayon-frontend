import { Icon, Button } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'
import { Header } from '@tanstack/react-table'
import type { TableRow } from '../types/table'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export const MENU_ID = 'column-header-menu'

const MenuButton = styled(Button)`
  background-color: unset !important;
  z-index: 110;
  position: relative;
  padding: 4px;

  &.hasIcon {
    padding: 4px;
  }

  &.open {
    background-color: unset !important;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }

  &.active {
    background-color: var(--md-sys-color-surface-container-hover) !important;
  }
`

// Animation for menu opening
const DialogOpenAnimation = keyframes`
  from {
    scale: 0.95;
    opacity: 0.6;
  }
  to {
    scale: 1;
    opacity: 1;
  }
`

const MenuDropdown = styled.div<{ position: { top: number; left: number } }>`
  position: fixed;
  top: ${(props) => props.position.top}px;
  left: ${(props) => props.position.left}px;
  
  /* Menu styling from Menu.styled.js */
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  padding: 8px;
  
  /* Colors and appearance */
  background-color: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border-radius: 8px;
  overflow: hidden;
  
  /* Shadow and z-index */
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  
  /* Animation */
  animation: ${DialogOpenAnimation} 0.03s ease-in forwards;
  transform-origin: top left;
  
  /* Minimum width */
  min-width: 160px;
`

const MenuItem = styled.button`
  /* Reset button styles */
  border: none;
  background: transparent;
  cursor: pointer;
  
  /* Layout from Menu.styled.js Item */
  display: flex;
  padding: 6px 16px 6px 12px;
  justify-content: flex-start;
  align-items: center;
  gap: var(--base-gap-large);
  align-self: stretch;
  border-radius: 4px;
  position: relative;
  user-select: none;
  
  /* Typography */
  font-size: 14px;
  color: var(--md-sys-color-on-surface);
  text-align: left;

  span {
    display: inline-block;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  .icon {
    font-size: 16px;
    color: var(--md-sys-color-on-surface);
  }
`

const Divider = styled.hr`
  margin: 0;
  width: 100%;
  border-style: solid;
  opacity: 0.5;
  border-color: var(--md-sys-color-surface-container-highest);
`

interface ColumnHeaderMenuProps {
  header: Header<TableRow, unknown>
  canHide?: boolean
  canPin?: boolean
  canSort?: boolean
  isResizing?: boolean
  className?: string
}

export const ColumnHeaderMenu = ({
  header,
  canHide,
  canPin,
  canSort,
  isResizing,
  className,
}: ColumnHeaderMenuProps) => {
  const { column } = header
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Hide the menu when resizing
  if (isResizing) {
    return null
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Calculate menu position
  const calculateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
  }

  const handleMenuToggle = () => {
    if (!isOpen) {
      calculateMenuPosition()
    }
    setIsOpen(!isOpen)
  }

  // Get current column state - we need to call these methods directly to get fresh state
  const isPinned = column.getIsPinned()
  const isVisible = column.getIsVisible()

  const menuItems: Array<{
    id: string
    label?: string
    icon?: string
    onClick?: () => void
  }> = []

  if (canPin) {
    const isPinnedLeft = isPinned === 'left'
    menuItems.push({
      id: 'pin',
      label: isPinnedLeft ? 'Unpin column' : 'Pin column',
      icon: 'push_pin',
      onClick: () => {
        if (isPinnedLeft) {
          column.pin(false)
        } else {
          column.pin('left')
        }
        setIsOpen(false)
      },
    })
  }

  // Add divider only if there are pin options and sort options
  if (canPin && canSort) {
    menuItems.push({
      id: 'divider',
    })
  }

  if (canSort) {
    menuItems.push({
      id: 'sort-asc',
      label: 'Sort ascending',
      icon: 'sort',
      onClick: () => {
        column.toggleSorting(false)
        setIsOpen(false)
      },
    })

    menuItems.push({
      id: 'sort-desc',
      label: 'Sort descending',
      icon: 'sort',
      onClick: () => {
        column.toggleSorting(true)
        setIsOpen(false)
      },
    })
  }

  // Add divider only if there are sort options and hide options
  if (canSort && canHide) {
    menuItems.push({
      id: 'divider',
    })
  }

  if (canHide) {
    menuItems.push({
      id: 'hide',
      label: isVisible ? 'Hide column' : 'Show column',
      icon: isVisible ? 'visibility_off' : 'visibility',
      onClick: () => {
        column.toggleVisibility()
        setIsOpen(false)
      },
    })
  }

  if (menuItems.length === 0) {
    return null
  }

  return (
    <>
      <MenuButton
        ref={buttonRef}
        className={clsx(className, { active: isOpen })}
        onClick={handleMenuToggle}
        icon="more_horiz"
      />
      {isOpen &&
        createPortal(
          <MenuDropdown ref={menuRef} position={menuPosition}>
            {menuItems.map((item, index) => {
              if (item.id === 'divider') {
                return <Divider key={`divider-${index}`} />
              }
              // Only render MenuItem if it has content
              if (!item.label && !item.icon) {
                return null
              }
              return (
                <MenuItem key={item.id} onClick={item.onClick}>
                  {item.icon && <Icon icon={item.icon} />}
                  {item.label}
                </MenuItem>
              )
            })}
          </MenuDropdown>,
          document.body,
        )}
    </>
  )
}
