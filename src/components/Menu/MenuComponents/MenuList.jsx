import React, { useEffect, useRef } from 'react'
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
  ...props
}) => {
  const itemRefs = useRef([])
  const menuRef = useRef(null)

  const handleSubMenu = (e, id, items) => {
    if (!itemRefs.current[id] || !menuRef.current) return
    onSubMenu &&
      onSubMenu(e, {
        id,
        style: {
          top: itemRefs.current[id].offsetTop + (style?.top || 0) - 4,
          right: menuRef.current.getBoundingClientRect().width + (style?.right || 0) - 12,
        },
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

  return (
    <Styled.MenuWrapper
      style={{ paddingRight: subMenu ? 16 : 0, ...style }}
      className={subMenu ? 'sub-menu' : 'menu-list'}
      id={id}
      onMouseLeave={handleMouseLeave}
      {...props}
      ref={menuRef}
    >
      <Styled.Menu>
        {items.map((item, i) => {
          // if item is a node, return it
          if (item.node) {
            return <div key={i}>{item.node}</div>
          }

          if (item?.id === 'divider') return <hr key={i} />

          const { label, icon, highlighted, onClick, link, items = [], id } = item

          return (
            <MenuItem
              tabIndex={0}
              key={`${id}-${i}`}
              {...{ label, icon, highlighted, items }}
              onClick={(e) =>
                items.length ? handleSubMenu(e, id, items) : handleClick(e, onClick, link)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (items.length) {
                    handleSubMenu(e, id, items)
                  } else {
                    handleClick(e, onClick, link)
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
              style={{ paddingRight: items.length ? '0' : '16px' }}
              ref={(e) => (itemRefs.current[id] = e)}
              onMouseEnter={(e) => handleSubMenu(e, id, items)}
              onMouseLeave={(e) => handleSubMenu(e, id, [])}
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
