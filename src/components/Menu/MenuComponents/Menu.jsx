import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

// ============================================
// STYLED COMPONENTS
// ============================================

const MenuContainer = styled.menu`
  display: flex;
  flex-direction: column;
  list-style-type: none;
  margin: 0;
  padding: 8px;
  gap: 4px;
  background-color: var(--md-sys-color-surface-container-high);
  border-radius: 8px;
  user-select: none;
  overflow: auto;
  max-height: 700px;
  border-radius: 8px;
  border: 1px solid var(--md-sys-color-surface-container-highest);

  hr {
    margin: 4px 0;
    width: 100%;
    border: none;
    border-top: 1px solid var(--md-sys-color-surface-container-highest);
    opacity: 0.5;
  }
`

const MenuItemContainer = styled.li`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  padding: 6px 16px 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--md-sys-color-on-surface);
  white-space: nowrap;
  transition: background-color 0.1s ease;

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }

  &.disabled {
    pointer-events: none;
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.highlighted {
    background-color: var(--md-sys-color-secondary-container);
    &:hover {
      background-color: var(--md-sys-color-secondary-container-hover);
    }
  }

  &.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    &:hover {
      background-color: var(--md-sys-color-primary-container-hover);
    }
  }

  &.danger {
    color: var(--md-sys-color-error);
    &:hover {
      background-color: var(--md-sys-color-error-container);
      color: var(--md-sys-color-on-error-container);
    }
  }

  .menu-item-label {
    flex: 1;
  }

  .menu-item-arrow {
    margin-left: auto;
  }

  /* Remove right padding when there's a submenu arrow */
  &:has(.menu-item-arrow) {
    padding-right: 0;
  }

  &:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }
`

const SubMenuWrapper = styled.div`
  position: fixed;
  z-index: 1001;
  pointer-events: auto;
`

const HoverBridge = styled.div`
  position: fixed;
  pointer-events: auto;
  z-index: 1000;
`

// ============================================
// CONSTANTS
// ============================================

const SUBMENU_GAP = 4
const VIEWPORT_PADDING = 20
const HOVER_DELAY = 150

// ============================================
// MENU ITEM COMPONENT
// ============================================

const MenuItem = ({
  item,
  onItemClick,
  level = 0,
  parentMenuRef,
  closeAllMenus,
}) => {
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [subMenuPosition, setSubMenuPosition] = useState({ top: 0, left: 0 })
  const [subMenuDirection, setSubMenuDirection] = useState('right')
  const [bridgeStyle, setBridgeStyle] = useState({})

  const itemRef = useRef(null)
  const subMenuRef = useRef(null)
  const hoverTimeoutRef = useRef(null)
  const closeTimeoutRef = useRef(null)

  const hasChildren = item.items && item.items.length > 0

  // Calculate submenu position and direction
  const calculatePosition = useCallback(() => {
    if (!itemRef.current || !hasChildren) return

    const itemRect = itemRef.current.getBoundingClientRect()

    // Get the parent menu by finding the closest menu element
    const parentMenu = itemRef.current.closest('menu')
    const parentRect = parentMenu?.getBoundingClientRect() || itemRect

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Estimate submenu width (will be refined after render)
    const estimatedSubMenuWidth = subMenuRef.current?.offsetWidth || 250
    const estimatedSubMenuHeight = subMenuRef.current?.offsetHeight || 300

    // Calculate available space on both sides
    const spaceOnRight = viewportWidth - parentRect.right - SUBMENU_GAP
    const spaceOnLeft = parentRect.left - SUBMENU_GAP

    // Determine horizontal direction - prefer left when there's space
    const shouldOpenLeft = spaceOnLeft >= estimatedSubMenuWidth + VIEWPORT_PADDING
    const direction = shouldOpenLeft ? 'left' : 'right'
    setSubMenuDirection(direction)

    // Calculate horizontal position
    let left
    if (direction === 'left') {
      left = parentRect.left - estimatedSubMenuWidth - SUBMENU_GAP
    } else {
      left = parentRect.right + SUBMENU_GAP
    }

    // Calculate vertical position
    let top = itemRect.top - 8

    // Ensure submenu fits vertically
    if (top + estimatedSubMenuHeight > viewportHeight - VIEWPORT_PADDING) {
      top = Math.max(
        VIEWPORT_PADDING,
        viewportHeight - estimatedSubMenuHeight - VIEWPORT_PADDING
      )
    }
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING
    }

    setSubMenuPosition({ top, left })

    // Calculate hover bridge between parent item and submenu
    const bridgeTop = itemRect.top
    const bridgeHeight = itemRect.height
    const bridgeLeft = direction === 'right' ? parentRect.right : left
    const bridgeWidth = direction === 'right'
      ? (left - parentRect.right)
      : (parentRect.left - (left + estimatedSubMenuWidth))

    setBridgeStyle({
      top: bridgeTop,
      left: bridgeLeft,
      width: Math.abs(bridgeWidth),
      height: bridgeHeight,
    })
  }, [hasChildren])

  // Handle mouse enter
  const handleMouseEnter = useCallback(() => {
    if (!hasChildren) return

    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    // Set a small delay before opening to prevent accidental triggers
    hoverTimeoutRef.current = setTimeout(() => {
      setSubMenuOpen(true)
      requestAnimationFrame(calculatePosition)
    }, HOVER_DELAY)
  }, [hasChildren, calculatePosition])

  // Handle mouse leave
  const handleMouseLeave = useCallback((e) => {
    if (!hasChildren) return

    // Clear hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }

    // Check if mouse is moving towards submenu
    const relatedTarget = e.relatedTarget
    if (
      relatedTarget &&
      subMenuRef.current &&
      subMenuRef.current.contains(relatedTarget)
    ) {
      // Mouse is entering submenu, don't close
      return
    }

    // Delay closing to allow smooth transition
    closeTimeoutRef.current = setTimeout(() => {
      setSubMenuOpen(false)
    }, 200)
  }, [hasChildren])

  // Handle submenu mouse enter
  const handleSubMenuMouseEnter = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  // Handle submenu mouse leave
  const handleSubMenuMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setSubMenuOpen(false)
    }, 200)
  }, [])

  // Handle item click
  const handleClick = useCallback((e) => {
    if (item.disabled) return

    if (hasChildren) {
      // Toggle submenu on click
      setSubMenuOpen((prev) => !prev)
      if (!subMenuOpen) {
        calculatePosition()
      }
    } else {
      // Execute item action
      if (item.onClick) {
        item.onClick(e)
      }
      if (onItemClick) {
        onItemClick(item, e)
      }
      // Close all menus after click
      if (closeAllMenus) {
        closeAllMenus()
      }
    }
  }, [item, hasChildren, subMenuOpen, calculatePosition, onItemClick, closeAllMenus])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (item.disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleClick(e)
        break
      case 'ArrowRight':
        if (hasChildren && !subMenuOpen) {
          e.preventDefault()
          setSubMenuOpen(true)
          calculatePosition()
        }
        break
      case 'ArrowLeft':
        if (level > 0) {
          e.preventDefault()
          setSubMenuOpen(false)
          itemRef.current?.focus()
        }
        break
      case 'Escape':
        e.preventDefault()
        if (subMenuOpen) {
          setSubMenuOpen(false)
        } else if (closeAllMenus) {
          closeAllMenus()
        }
        break
      default:
        break
    }
  }, [item.disabled, handleClick, hasChildren, subMenuOpen, level, calculatePosition, closeAllMenus])

  // Recalculate position when submenu opens
  useEffect(() => {
    if (subMenuOpen) {
      // Wait for submenu to render
      requestAnimationFrame(() => {
        calculatePosition()
      })
    }
  }, [subMenuOpen, calculatePosition])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  // Render divider
  if (item.id === 'divider') {
    return <hr />
  }

  // Render custom node
  if (item.node) {
    return item.node
  }

  const className = [
    item.disabled && 'disabled',
    item.highlighted && 'highlighted',
    item.selected && 'selected',
    item.danger && 'danger',
  ].filter(Boolean).join(' ')

  return (
    <>
      <MenuItemContainer
        ref={itemRef}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        tabIndex={item.disabled ? -1 : 0}
        role="menuitem"
        aria-haspopup={hasChildren}
        aria-expanded={hasChildren ? subMenuOpen : undefined}
        aria-disabled={item.disabled}
      >
        {item.icon && <Icon icon={item.icon} />}
        <span className="menu-item-label">{item.label}</span>
        {item.shortcut && (
          <span style={{ fontSize: '0.85em', opacity: 0.7 }}>{item.shortcut}</span>
        )}
        {item.active && <Icon icon="check" />}
        {hasChildren && <Icon icon="arrow_right" className="menu-item-arrow" />}
      </MenuItemContainer>

      {/* Render submenu */}
      {hasChildren && subMenuOpen && createPortal(
        <>
          {/* Hover bridge */}
          <HoverBridge
            style={bridgeStyle}
            onMouseEnter={handleSubMenuMouseEnter}
            onMouseLeave={handleSubMenuMouseLeave}
          />

          {/* Submenu */}
          <SubMenuWrapper
            ref={subMenuRef}
            style={{
              top: `${subMenuPosition.top}px`,
              left: `${subMenuPosition.left}px`,
            }}
            onMouseEnter={handleSubMenuMouseEnter}
            onMouseLeave={handleSubMenuMouseLeave}
          >
            <Menu
              items={item.items}
              onItemClick={onItemClick}
              level={level + 1}
              parentMenuRef={subMenuRef}
              closeAllMenus={closeAllMenus}
            />
          </SubMenuWrapper>
        </>,
        document.body
      )}
    </>
  )
}

// ============================================
// MAIN MENU COMPONENT
// ============================================

const Menu = ({
  menu = [],      // Main prop for compatibility with existing API
  items = [],     // Alternative prop name
  onItemClick,
  onClose,        // Callback from MenuContainer
  level = 0,
  parentMenuRef,
  closeAllMenus,
  className,
  style,
}) => {
  const menuRef = useRef(null)

  // Use 'menu' prop if provided, otherwise fall back to 'items'
  const menuItems = menu.length > 0 ? menu : items

  // Filter out hidden items
  const visibleItems = menuItems.filter((item) => !item.hidden)

  // Create closeAllMenus handler if not provided
  const handleCloseAllMenus = closeAllMenus || onClose || (() => {})

  return (
    <MenuContainer
      ref={menuRef}
      className={className}
      style={style}
      role="menu"
      aria-orientation="vertical"
    >
      {visibleItems.map((item, index) => (
        <MenuItem
          key={item.id || `menu-item-${index}`}
          item={item}
          onItemClick={onItemClick}
          level={level}
          parentMenuRef={parentMenuRef || menuRef}
          closeAllMenus={handleCloseAllMenus}
        />
      ))}
    </MenuContainer>
  )
}

export default Menu
