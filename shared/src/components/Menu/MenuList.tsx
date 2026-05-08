import React, { useEffect, useLayoutEffect, useRef } from 'react'
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
  /** Called by a sub-menu after it mounts, with its real measured style. Lets the parent
   *  refit using actual width/height instead of the open-time estimate. */
  onSubMenuLayout?: (id: string, style: React.CSSProperties, placement: 'left' | 'right') => void
  subMenu?: boolean
  level: number
  id?: string
  parentRef?: HTMLElement | null
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
    // Use the visible inner <menu> element if present — the wrapper has 16px paddingLeft
    // for sub-menus which would otherwise produce a phantom gap on flip-left chains.
    const parentVisibleEl = (parentMenuEl.querySelector('menu') as HTMLElement | null) ?? parentMenuEl
    const parentVisibleRect = parentVisibleEl.getBoundingClientRect()

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8
    // Use the parent's visible width as the initial estimate — sub-menus tend to be
    // similar size or smaller. Falls back to 240 if parent is unusually narrow.
    const estimatedWidth = Math.max(240, parentVisibleRect.width)
    const estimatedHeight = Math.min(items.length * 36 + 16, 480)

    // Choose horizontal placement. If an ancestor sub-menu has already flipped to the
    // left, every descendant sub-menu also goes left — DetailsPanel scenarios put the
    // root menu near the right edge of the screen, so flipping flip-flop on each level
    // would push deep menus back into the panel content.
    const gap = 4
    const computeLeftSide = () => Math.max(padding, parentVisibleRect.left - estimatedWidth - gap)
    const computeRightSide = () => parentVisibleRect.right + gap
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

    // Align first sub-menu item with the hovered parent item. The visible <menu> has
    // 8px top padding, so the wrapper top sits 8px above the item top.
    const innerTopOffset = 8
    let viewportTop = itemRect.top - innerTopOffset
    if (viewportTop + estimatedHeight > viewportHeight - padding) {
      viewportTop = Math.max(padding, viewportHeight - estimatedHeight - padding)
    }

    // Sub-menu wrappers carry 16px paddingLeft (so their wrapper rect is wider than
    // the visible menu). When we anchor on the LEFT side, the visible menu sits 16px
    // inside the wrapper — pull the wrapper left so the visible right edge lines up
    // with parentVisibleRect.left.
    const subMenuPaddingLeft = 16
    const wrapperLeft = nextPlacement === 'left' ? viewportLeft - subMenuPaddingLeft : viewportLeft

    onSubMenu?.(e, {
      id,
      style: {
        top: viewportTop - offsetParentRect.top,
        left: wrapperLeft - offsetParentRect.left,
      },
      items,
      level: level,
      placement: nextPlacement,
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
    const parentMenuEl = parentItemEl.closest('.menu-list, .sub-menu') as HTMLElement | null
    if (!parentMenuEl) return
    // Measure visible boxes (the inner <menu> tag), not wrappers. Sub-menu wrappers
    // carry 16px paddingLeft which inflates the rect on the left side and would
    // otherwise produce phantom gaps when flipping left.
    const ownVisibleEl = (wrapperEl.querySelector('menu') as HTMLElement | null) ?? wrapperEl
    const parentVisibleEl = (parentMenuEl.querySelector('menu') as HTMLElement | null) ?? parentMenuEl

    const offsetParent = (wrapperEl.offsetParent as HTMLElement | null) ?? document.body
    const offsetParentRect = offsetParent.getBoundingClientRect()
    const wrapperRect = wrapperEl.getBoundingClientRect()
    const ownVisibleRect = ownVisibleEl.getBoundingClientRect()
    const parentVisibleRect = parentVisibleEl.getBoundingClientRect()
    const parentItemRect = parentItemEl.getBoundingClientRect()

    // Some wrappers have 16px left padding (sub-menus). Track it so we can place the
    // wrapper such that the visible-menu edge — not the wrapper edge — lines up.
    const subMenuPaddingLeft = ownVisibleRect.left - wrapperRect.left
    const visibleWidth = ownVisibleRect.width
    const visibleHeight = ownVisibleRect.height

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const padding = 8

    const gap = 4
    const computeLeftSide = () => Math.max(padding, parentVisibleRect.left - visibleWidth - gap)
    const computeRightSide = () => parentVisibleRect.right + gap
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
    let viewportTop = wrapperRect.top + deltaY
    if (viewportTop + visibleHeight > viewportHeight - padding) {
      viewportTop = Math.max(padding, viewportHeight - visibleHeight - padding)
    }

    // Wrapper origin: visible target minus the wrapper's left padding when on the left.
    const wrapperLeft =
      nextPlacement === 'left' ? viewportLeft - subMenuPaddingLeft : viewportLeft

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
      onSubMenuLayout(id, { top: targetTop, left: targetLeft }, nextPlacement)
    }
  }, [subMenu, items, parentRef, id, placement, style?.top, style?.left, onSubMenuLayout])

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
