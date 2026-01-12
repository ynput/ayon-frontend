import React, { useEffect, useRef } from 'react'
import MenuItem from './MenuItem'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './Menu.styled'
import { PowerpackFeature, usePowerpack } from '@shared/context'
import type { MenuItemType } from './Menu'

interface MenuListProps {
  items: MenuItemType[]
  handleClick: (
    e: React.MouseEvent,
    onClick?: (e: React.MouseEvent) => void,
    url?: string,
    disableClose?: boolean,
  ) => void
  onSubMenu?: (e: React.MouseEvent, menu: any) => void
  subMenu?: boolean
  level: number
  id?: string
  parentRef?: HTMLElement | null
  style?: React.CSSProperties
  onClose?: (id?: string) => void
  onMenuClose?: () => void
  itemClassName?: string
  itemStyle?: React.CSSProperties
  setPowerpackDialog?: (feature: PowerpackFeature) => void
  [key: string]: any
}

export const MenuList: React.FC<MenuListProps> = ({
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
  const itemRefs = useRef<{ [key: string]: HTMLElement | null }>({})
  const menuRef = useRef<HTMLDivElement>(null)

  const handleSubMenu = (e: React.MouseEvent, id: string, items: MenuItemType[]) => {
    if (!itemRefs.current[id] || !menuRef.current) return

    // Find DialogContent - the actual positioning context for all submenus
    const dialogContent = menuRef.current.closest('[id="content"]') as HTMLElement | null
    // Find Section - used to account for gap offset
    const section = dialogContent?.querySelector('section') as HTMLElement | null

    if (dialogContent && section) {
      const itemRect = itemRefs.current[id]!.getBoundingClientRect()
      const dialogRect = dialogContent.getBoundingClientRect()
      const sectionRect = section.getBoundingClientRect()

      // Calculate the gap/offset between DialogContent and Section
      // This accounts for any flex gap or other spacing
      const gapOffset = sectionRect.top - dialogRect.top

      console.log('Submenu calculation:', {
        itemTop: itemRect.top,
        itemBottom: itemRect.bottom,
        itemHeight: itemRect.height,
        dialogTop: dialogRect.top,
        sectionTop: sectionRect.top,
        gapOffset: gapOffset,
        calculated: itemRect.top - dialogRect.top - 4,
        calculatedWithGap: itemRect.top - sectionRect.top - 4,
        level: level,
        isSubMenu: subMenu,
        parentStyleTop: style?.top,
        oldMethod: itemRefs.current[id]!.offsetTop + ((style?.top as number) || 0) - 4
      })

      onSubMenu?.(e, {
        id,
        style: {
          // Calculate relative to Section - removed -4 offset to test alignment
          top: itemRect.top - sectionRect.top,
          left: menuRef.current.getBoundingClientRect().width + ((style?.left as number) || 0) - 12,
        },
        items,
        level: level,
      })
    } else {
      // Fallback to old calculation if DialogContent not found
      console.log('DialogContent not found, using fallback')
      onSubMenu?.(e, {
        id,
        style: {
          top: itemRefs.current[id]!.offsetTop + ((style?.top as number) || 0) - 4,
          left: menuRef.current.getBoundingClientRect().width + ((style?.left as number) || 0) - 12,
        },
        items,
        level: level,
      })
    }
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (subMenu) {
      onSubMenu?.(e, { id: 'parent', items: [] })
    }
  }

  //   when a subMenu open, set focus on the first item
  useEffect(() => {
    if (subMenu && menuRef.current) {
      const first = menuRef.current.querySelectorAll('li, button')[0] as HTMLElement
      first?.focus()
    }
  }, [subMenu])

  return (
    <Styled.MenuWrapper
      style={{ paddingLeft: subMenu ? 16 : 0, ...style }}
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

            if (item?.id === 'divider' || item?.separator ) return <hr key={i} />

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

            const handleClickPowerFeature = (e: React.MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
              if (powerFeature) {
                setPowerpackDialog?.(powerFeature)
              }

              // close the menu
              onMenuClose?.()
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
                onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
                  if (e.key === 'Enter') {
                    if (isPowerFeature) {
                      handleClickPowerFeature(e as any)
                    } else if (items.length) {
                      handleSubMenu(e as any, id, items)
                    } else {
                      handleClick(e as any, onClick, link)
                    }
                  }
                  const isLastChild = !(e.target as HTMLElement).nextSibling
                  if (e.key === 'Tab' && isLastChild && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    //   when at bottom of list, tab goes to top
                    const first = menuRef.current?.querySelectorAll('li, button')[0] as HTMLElement
                    first?.focus()
                  }
                  //   when a submenu is open, esc closes it and sets focus on the parent
                  if (e.key === 'Escape' && subMenu && parentRef) {
                    e.preventDefault()
                    e.stopPropagation()
                    parentRef.focus()
                    onClose?.(id)
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
