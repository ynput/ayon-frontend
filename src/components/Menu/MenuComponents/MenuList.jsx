import React, { useEffect, useRef, useState } from 'react'
import * as Styled from './Menu.styled'
import MenuItem from './MenuItem'

const MenuList = ({
  items,
  handleClick,
  level = 0,
  id = 'root-menu',
  parentRef,
  style = {},
  onClose,
  onMenuClose,
  itemClassName,
  itemStyle,
  setPowerpackDialog,
  menuRef: parentMenuRef,
  ...props
}) => {
  const menuRef = useRef(null)
  const [adjustedTop, setAdjustedTop] = useState(0)

  const isSubMenu = level > 0

  // Viewport adjustments
  useEffect(() => {
    if (!menuRef.current) return
    const menuElement = menuRef.current.querySelector('menu')
    if (!menuElement) return

    const rect = menuRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    // Set max height
    const availableHeight = viewportHeight - rect.top - 60
    const maxHeight = Math.min(700, availableHeight)
    menuElement.style.maxHeight = `${maxHeight}px`

    // Viewport collision adjustments
    let adjustment = 0
    if (rect.bottom > viewportHeight - 60) {
      adjustment = -(rect.bottom - (viewportHeight - 60) + 10)
    } else if (rect.top < 50) {
      adjustment = 50 - rect.top
    }

    if (adjustment !== 0) setAdjustedTop(adjustment)
  }, [items])

  const finalTop = (style?.top || 0) + adjustedTop
  const finalLeft = style?.left

  return (
    <Styled.MenuWrapper
      style={{
        paddingRight: isSubMenu ? 16 : 0,
        ...style,
        top: finalTop,
        left: finalLeft,
      }}
      className={isSubMenu ? 'sub-menu' : 'menu-list'}
      id={id}
      ref={menuRef}
      {...props}
    >
      <Styled.Menu>
        {items
          .filter((item) => !item.hidden)
          .map((item, i) => {
            // Handle custom nodes
            if (item.node) return item.node

            // Handle dividers
            if (item?.id === 'divider') return <hr key={i} />

            const itemId = item.id || `item-${i}`

            return (
              <MenuItem
                key={itemId}
                label={item.label}
                icon={item.icon}
                img={item.img}
                highlighted={item.highlighted}
                selected={item.selected}
                disabled={item.disabled}
                powerFeature={item.powerFeature}
                active={item.active}
                items={item.items || []}
                isLink={item.link}
                shortcut={item.shortcut}
                itemId={itemId}
                level={level}
                menuRef={parentMenuRef || menuRef}
                handleClick={handleClick}
                onMenuClose={onMenuClose}
                itemClassName={itemClassName}
                itemStyle={itemStyle}
                setPowerpackDialog={setPowerpackDialog}
                parentRef={parentRef}
                onClose={onClose}
                onClick={item.onClick}
                disableClose={item.disableClose}
              />
            )
          })}
      </Styled.Menu>
    </Styled.MenuWrapper>
  )
}

export default MenuList
