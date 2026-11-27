import React, { useEffect, useLayoutEffect, useRef } from 'react'
import MenuItem from './MenuItem'
import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './Menu.styled'
import { MENU_TOP_BOUND } from './Menu.styled'
import { usePowerpack, type PowerpackFeature } from '@shared/context'
import type { MenuItemType } from './Menu'
import { tidyMenuSections } from './menuSections'
import { MenuStyles } from './MenuStyles'

interface MenuListProps {
  items: MenuItemType[]
  handleClick: (
    e: React.MouseEvent,
    onClick?: (e: React.MouseEvent) => void,
    url?: string,
    disableClose?: boolean,
  ) => void
  onSubMenu?: (e: React.MouseEvent, menu: any) => void
  /** Called by a sub-menu after it mounts, with its real measured style. Lets the parent
   *  refit using actual width/height instead of the open-time estimate. */
  onSubMenuLayout?: (id: string, style: React.CSSProperties, placement: 'left' | 'right') => void
  subMenu?: boolean
  level: number
  id?: string
  parentRef?: HTMLElement | null
  /** consumed here so the spread below doesn't leak it onto the DOM wrapper */
  parentEl?: HTMLElement | null
  style?: React.CSSProperties
  /** Placement of THIS menu relative to its parent. Inherited by descendants so once
   *  a chain flips to one side it stays there. */
  placement?: 'left' | 'right'
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
  onSubMenuLayout,
  subMenu,
  level,
  id = 'root-menu',
  parentRef,
  parentEl: _parentEl,
  style,
  placement,
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
    const itemEl = itemRefs.current[id]
    const parentMenuEl = menuRef.current
    if (!itemEl || !parentMenuEl) return

    // Sub-menus render absolute inside DialogContent. Compute viewport-anchored coords
    // from this item's bounding rect, then translate into the offsetParent's coord space.
    // Each level computes independently — no inherited offsets that drift across depth.
    const offsetParent = (parentMenuEl.offsetParent as HTMLElement | null) ?? document.body
    const offsetParentRect = offsetParent.getBoundingClientRect()
    const itemRect = itemEl.getBoundingClientRect()
    const parentVisibleEl =
      (parentMenuEl.querySelector('menu') as HTMLElement | null) ?? parentMenuEl
    const parentVisibleRect = parentVisibleEl.getBoundingClientRect()

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8
    // Use the parent's visible width as the initial estimate — sub-menus tend to be
    // similar size or smaller. Falls back to 240 if parent is unusually narrow.
    const estimatedWidth = Math.max(240, parentVisibleRect.width)
    // sub-menus may run all the way to the bottom of the window and scroll from there
    const estimatedHeight = Math.min(
      items.length * 36 + 16,
      viewportHeight - MENU_TOP_BOUND - padding,
    )

    // Choose horizontal placement. If an ancestor sub-menu has already flipped to the
    // left, every descendant sub-menu also goes left — DetailsPanel scenarios put the
    // root menu near the right edge of the screen, so flipping flip-flop on each level
    // would push deep menus back into the panel content.
    // The sub-menu starts at the hovered item's edge, so it overlaps the parent menu's padding.
    const computeLeftSide = () => Math.max(padding, itemRect.left - estimatedWidth)
    const computeRightSide = () => itemRect.right
    const fitsRight = computeRightSide() + estimatedWidth <= viewportWidth - padding
    const fitsLeft = computeLeftSide() >= padding

    let nextPlacement: 'left' | 'right'
    let viewportLeft: number
    if (placement === 'left' && fitsLeft) {
      nextPlacement = 'left'
      viewportLeft = computeLeftSide()
    } else if (fitsRight) {
      nextPlacement = 'right'
      viewportLeft = computeRightSide()
    } else if (fitsLeft) {
      nextPlacement = 'left'
      viewportLeft = computeLeftSide()
    } else {
      // Neither side fits cleanly — clamp to viewport, prefer left.
      nextPlacement = 'left'
      viewportLeft = Math.max(padding, viewportWidth - estimatedWidth - padding)
    }

    // Align first sub-menu item with the hovered parent item: the wrapper top sits one menu
    // padding plus the sub-menu's outline above the item top.
    const parentStyle = getComputedStyle(parentVisibleEl)
    const innerTopOffset =
      (parseFloat(parentStyle.paddingTop) || 0) +
      (parseFloat(parentStyle.getPropertyValue('--menu-border-width')) || 0)
    let viewportTop = itemRect.top - innerTopOffset
    if (viewportTop + estimatedHeight > viewportHeight - padding) {
      viewportTop = viewportHeight - estimatedHeight - padding
    }
    // above the dialog's own box the menu is clipped and can't be scrolled back into view
    viewportTop = Math.max(MENU_TOP_BOUND, viewportTop)

    onSubMenu?.(e, {
      id,
      style: {
        top: viewportTop - offsetParentRect.top,
        left: viewportLeft - offsetParentRect.left,
        maxHeight: viewportHeight - viewportTop - padding,
      },
      items,
      level: level,
      placement: nextPlacement,
      // Pass the actual menu-item element so sub-menu measurement uses the <li>
      // instead of whatever inner span the mouse event bubbled from.
      parentEl: itemEl,
    })
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

  // Sub-menus open with an estimated width — once mounted, measure for real and refit.
  // Reuses the same flip/clamp rules as handleSubMenu but with the actual rendered size.
  useLayoutEffect(() => {
    if (!subMenu || !menuRef.current || !parentRef || !onSubMenuLayout || !id) return
    const wrapperEl = menuRef.current
    const parentItemEl = parentRef
    // Measure the visible box (the inner <menu> tag), so the visible edge, not the
    // wrapper's, lines up with the parent item.
    const ownVisibleEl = (wrapperEl.querySelector('menu') as HTMLElement | null) ?? wrapperEl

    const offsetParent = (wrapperEl.offsetParent as HTMLElement | null) ?? document.body
    const offsetParentRect = offsetParent.getBoundingClientRect()
    const wrapperRect = wrapperEl.getBoundingClientRect()
    const ownVisibleRect = ownVisibleEl.getBoundingClientRect()
    const parentItemRect = parentItemEl.getBoundingClientRect()

    const subMenuPaddingLeft = ownVisibleRect.left - wrapperRect.left
    const visibleWidth = ownVisibleRect.width

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8

    // start at the parent item's edge, overlapping the parent menu's padding
    const computeLeftSide = () => Math.max(padding, parentItemRect.left - visibleWidth)
    const computeRightSide = () => parentItemRect.right
    const fitsRight = computeRightSide() + visibleWidth <= viewportWidth - padding
    const fitsLeft = computeLeftSide() >= padding

    let nextPlacement: 'left' | 'right'
    let viewportLeft: number
    if (placement === 'left' && fitsLeft) {
      nextPlacement = 'left'
      viewportLeft = computeLeftSide()
    } else if (fitsRight) {
      nextPlacement = 'right'
      viewportLeft = computeRightSide()
    } else if (fitsLeft) {
      nextPlacement = 'left'
      viewportLeft = computeLeftSide()
    } else {
      nextPlacement = 'left'
      viewportLeft = Math.max(padding, viewportWidth - visibleWidth - padding)
    }

    // Align this sub-menu's first <li> with the hovered parent item.
    // Direct DOM measurement is more robust than computed-style math across nested
    // levels — picks up any box-sizing / margin quirks that pure padding values miss.
    const firstItemEl = ownVisibleEl.querySelector(':scope > li') as HTMLElement | null
    const firstItemRect = firstItemEl?.getBoundingClientRect()
    // Move the wrapper by exactly the delta between where the first <li> currently is
    // and where we want it (parent item's top). Avoids any cascading offset arithmetic.
    const desiredFirstItemTop = parentItemRect.top
    const currentFirstItemTop = firstItemRect ? firstItemRect.top : wrapperRect.top + 8
    const deltaY = desiredFirstItemTop - currentFirstItemTop
    const contentHeight = ownVisibleEl.scrollHeight
    let viewportTop = wrapperRect.top + deltaY
    if (viewportTop + contentHeight > viewportHeight - padding) {
      const fittedHeight = Math.min(contentHeight, viewportHeight - MENU_TOP_BOUND - padding)
      viewportTop = viewportHeight - fittedHeight - padding
    }
    // above the dialog's own box the menu is clipped and can't be scrolled back into view
    viewportTop = Math.max(MENU_TOP_BOUND, viewportTop)

    // Wrapper origin: visible target minus the wrapper's left padding when on the left.
    const wrapperLeft = nextPlacement === 'left' ? viewportLeft - subMenuPaddingLeft : viewportLeft

    const targetTop = viewportTop - offsetParentRect.top
    const targetLeft = wrapperLeft - offsetParentRect.left
    const currentTop = typeof style?.top === 'number' ? style.top : parseFloat(String(style?.top))
    const currentLeft =
      typeof style?.left === 'number' ? style.left : parseFloat(String(style?.left))

    // Idempotent guard: only emit a layout update when the target differs by >1px
    // from what's already applied. This makes the effect safe to re-run on every
    // dependency change — including `style`, which we update from inside this effect.
    // After a successful update, the new style flows back as props, the effect runs
    // once more, current ≈ target, and the guard is a no-op. No infinite loop.
    if (Math.abs(targetTop - currentTop) > 1 || Math.abs(targetLeft - currentLeft) > 1) {
      onSubMenuLayout(
        id,
        { top: targetTop, left: targetLeft, maxHeight: viewportHeight - viewportTop - padding },
        nextPlacement,
      )
    }
  }, [subMenu, items, parentRef, id, placement, style?.top, style?.left, onSubMenuLayout])

  return (
    <>
      {/* also here, so a menu rendered outside MenuContainer gets the menu sizes */}
      {!subMenu && <MenuStyles />}
      <Styled.MenuWrapper
        style={style}
        className={subMenu ? 'sub-menu' : 'menu-list'}
        id={id}
        onMouseLeave={handleMouseLeave}
        {...props}
        ref={menuRef}
      >
        <Styled.Menu>
          {tidyMenuSections(items).map((item, i) => {
            // if item is a node, return it
            if (item.node) {
              return item.node
            }

            if (item?.id === 'divider' || item?.separator) return <hr key={i} />

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
              reserveActiveSlot,
              endActions,
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
                  reserveActiveSlot,
                  endActions,
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
                style={itemStyle}
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
    </>
  )
}
