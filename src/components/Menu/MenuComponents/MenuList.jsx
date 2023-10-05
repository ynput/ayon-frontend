import React, { useEffect, useRef, useState } from 'react'
import MenuItem from './MenuItem'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './Menu.styled'

const MenuList = ({
  items,
  handleClick,
  onSubMenu,
  subMenu,
  level,
  id = 'root-menu',
  parentRef,
  style,
  onClose,
  itemClassName,
  itemStyle,
  compact,
  ...props
}) => {
  const itemRefs = useRef([])
  const menuRef = useRef(null)

  const [top, setTop] = useState(style?.top || 0)

  const handleSubMenu = (e, id, items) => {
    if (!itemRefs.current[id] || !menuRef.current) return
    const menuRect = menuRef.current.getBoundingClientRect()
    const liItemRect = itemRefs.current[id].getBoundingClientRect()

    // calculate the position of the submenu
    const top = itemRefs.current[id].offsetTop + (style?.top || 0)
    const gap = 4
    const left = (style?.left || 0) + menuRect.width + gap
    let right = 0
    // check if the submenu is off the screen on the right, if so flip to left hand side

    if (liItemRect.left + liItemRect.width + left > window.innerWidth) {
      right = liItemRect.width + gap
    }

    const pos = { top }
    if (right) pos.right = right
    else pos.left = left

    onSubMenu &&
      onSubMenu(e, {
        id,
        style: pos,
        items,
        level: level,
      })
  }

  const handleMouseLeave = (e) => {
    if (subMenu) {
      onSubMenu && onSubMenu(e, { id: parent, items: null })
    }
  }

  //   when a subMenu open, set focus on the first item
  useEffect(() => {
    if (subMenu) {
      const first = menuRef.current.querySelectorAll('li, button')[0]
      first && first.focus()
    }
  }, [subMenu])

  // check that the menu is not off the screen
  useEffect(() => {
    if (!menuRef.current) return
    const { height } = menuRef.current.getBoundingClientRect()
    const top = style?.top || 0
    const windowHeight = window.innerHeight
    if (top + height > windowHeight) {
      const newTop = windowHeight - height - 60
      setTop(newTop)
    } else {
      setTop(top)
    }
  }, [menuRef.current, style?.top, subMenu])

  return (
    <Styled.MenuWrapper
      style={{ paddingRight: subMenu ? 16 : 0, ...style, top }}
      className={subMenu ? 'sub-menu' : 'menu-list'}
      id={id}
      onMouseLeave={handleMouseLeave}
      {...props}
      ref={menuRef}
    >
      <Styled.Menu className={compact ? 'compact' : ''}>
        {items.map((item, i) => {
          // if item is a node, return it
          if (item.node) {
            return <div key={i}>{item.node}</div>
          }

          if (item?.id === 'divider') return <hr key={i} />

          const {
            label,
            icon,
            highlighted,
            onClick,
            link,
            items = [],
            id,
            disableClose,
            selected,
            ...props
          } = item

          return (
            <MenuItem
              tabIndex={0}
              key={`${id}-${i}`}
              {...{ label, icon, highlighted, items, selected }}
              onClick={(e) => {
                items.length
                  ? handleSubMenu(e, item, items)
                  : handleClick(e, item, onClick, link, disableClose)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (items.length) {
                    handleSubMenu(e, id, items)
                  } else {
                    handleClick(e, id, onClick, link)
                  }
                }
                const isLastChild = !e.target.nextSibling
                if (e.key === 'Tab' && isLastChild && !e.shiftKey) {
                  e.preventDefault()
                  e.stopPropagation()
                  //   when at bottom of list, tab goes to top
                  const first = menuRef.current.querySelectorAll('li, button')[0]
                  first && first.focus()
                }
                //   when a submenu is open, esc closes it and sets focus on the parent
                if (e.key === 'Escape' && subMenu && parentRef) {
                  e.preventDefault()
                  e.stopPropagation()
                  parentRef.focus()
                  onClose(id)
                }
              }}
              style={{ paddingRight: items.length ? '0' : '16px', ...itemStyle }}
              ref={(e) => (itemRefs.current[id] = e)}
              onMouseEnter={(e) => handleSubMenu(e, id, items)}
              onMouseLeave={(e) => handleSubMenu(e, id, [])}
              className={`${itemClassName} ${props.className || ''}`}
              {...props}
            >
              {!!items.length && <Icon icon="arrow_right" style={{ marginLeft: 'auto' }} />}
            </MenuItem>
          )
        })}
      </Styled.Menu>
    </Styled.MenuWrapper>
  )
}

export default MenuList
