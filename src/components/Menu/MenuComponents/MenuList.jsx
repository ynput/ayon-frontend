import React, { useEffect, useRef, useState } from 'react'
import MenuItem from './MenuItem'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './Menu.styled'
import { usePowerpack } from '@shared/context'

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
  onMenuClose,
  itemClassName,
  itemStyle,
  setPowerpackDialog,
  ...props
}) => {
  const itemRefs = useRef([])
  const menuRef = useRef(null)

  const [top, setTop] = useState(style?.top || 0)

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

  // check that the menu is not off the screen
  useEffect(() => {
    if (!menuRef.current) return
    const { top, height } = menuRef.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    if (top + height > windowHeight) {
      const newTop = windowHeight - height - 60
      setTop(newTop)
    }
  }, [menuRef.current])

  return (
    <Styled.MenuWrapper
      style={{ paddingRight: subMenu ? 16 : 0, ...style, top }}
      className={subMenu ? 'sub-menu' : 'menu-list'}
      id={id}
      onMouseLeave={handleMouseLeave}
      {...props}
      ref={menuRef}
    >
      <Styled.Menu>
        {items
          .filter((item) => !item.hidden)
          .map((item, i) => {
            // if item is a node, return it
            if (item.node) {
              return item.node
            }

            if (item?.id === 'divider') return <hr key={i} />

            const {
              label,
              icon,
              img,
              highlighted,
              onClick,
              link,
              items = [],
              id,
              disableClose,
              selected,
              disabled,
              powerFeature,
              active,
              ...props
            } = item

            const { powerLicense } = usePowerpack()
            const isPowerFeature = !powerLicense && powerFeature

            const handleClickPowerFeature = (e) => {
              e.preventDefault()
              e.stopPropagation()
              setPowerpackDialog(powerFeature)

              // close the menu
              onMenuClose && onMenuClose()
            }

            return (
              <MenuItem
                tabIndex={0}
                key={`${id}-${i}`}
                {...{
                  label,
                  icon,
                  img,
                  highlighted,
                  items,
                  selected,
                  disabled,
                  powerFeature,
                  active,
                }}
                isLink={link}
                onClick={(e) =>
                  isPowerFeature
                    ? handleClickPowerFeature(e)
                    : items.length
                    ? handleSubMenu(e, id, items)
                    : handleClick(e, onClick, link, disableClose)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (isPowerFeature) {
                      handleClickPowerFeature(e)
                    } else if (items.length) {
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
