import { Fragment, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@ynput/ayon-react-components'
import { Menu, MenuContainer } from '@shared/components'
import { useMenuContext } from '@shared/context'
import { useAppSelector } from '@state/store'
import {
  filterNavigation,
  findActiveItem,
  itemLandingPath,
  sortForSidebar,
  useNavAccess,
} from './filterNavigation'
import { useProjectNavigation } from './useProjectNavigation'
import { useStudioNavigation } from './useStudioNavigation'
import type { NavItem, NavLayout } from './types'
import { arrangeItems } from './layouts/applyLayout'
import { useNavLayout } from './layouts/useActiveLayout'
import AdminDock from './AdminDock'
import RailItem from './RailItem'
import * as Styled from './NavRail.styled'

// the project path a page is on: the project rail shows there, Home's rail everywhere else
const PROJECT_PATH = /^\/projects\/([^/]+)/

interface RailProps {
  items: NavItem[]
  /** pinned to the bottom, after the sections: the admin area */
  footer: ReactNode
  /** the layout that applies: which items show, in what order */
  layout: NavLayout
  /** that layout's id: when another one applies, a page it hides gives way to its first item */
  layoutId?: string
}

// what folds into More: the rail's divider (with its margins) and an item's height
const DIVIDER_HEIGHT = 9
const MORE_HEIGHT = 54

const Rail = ({ items, footer, layout, layoutId }: RailProps) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const access = useNavAccess()
  const { toggleMenuOpen } = useMenuContext()
  const railRef = useRef<HTMLElement>(null)
  const moreAnchorRef = useRef<HTMLSpanElement>(null)

  const visible = useMemo(
    () => arrangeItems(sortForSidebar(filterNavigation(items, access, layout)), layout),
    [items, access, layout],
  )
  const active = findActiveItem(items, pathname)

  // switching layouts while on a page the new one hides opens its first item; a hidden page is
  // still reachable by its link while the layout stays the same
  const shownLayout = useRef(layoutId)
  useEffect(() => {
    if (shownLayout.current === layoutId) return
    shownLayout.current = layoutId
    if (active && !visible.some((item) => item.id === active.id) && visible[0]) {
      const to = itemLandingPath(visible[0], access)
      if (to) navigate(to)
    }
  }, [layoutId, active, visible, access, navigate])

  // each item's height while it is on the rail, and the rail's height for the sections
  const [heights, setHeights] = useState<Record<string, number>>({})
  const [available, setAvailable] = useState(Infinity)
  const measure = () => {
    const rail = railRef.current
    if (!rail) return
    const measured: Record<string, number> = {}
    rail.querySelectorAll<HTMLElement>('[data-rail-section-item]').forEach((el) => {
      measured[el.dataset.railItem!] = el.offsetHeight
    })
    // only a change re-renders: this runs after every render
    if (Object.entries(measured).some(([id, height]) => heights[id] !== height))
      setHeights({ ...heights, ...measured })
    const pinnedHeight = [...rail.querySelectorAll<HTMLElement>('[data-rail-pinned]')].reduce(
      (sum, el) => sum + el.offsetHeight + 2,
      0,
    )
    // the rail's padding (12) and the spacer's least height (8)
    const free = rail.clientHeight - 12 - 8 - pinnedHeight
    if (available !== free) setAvailable(free)
  }
  useLayoutEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (railRef.current) observer.observe(railRef.current)
    return () => observer.disconnect()
  })

  // items that don't fit fold into More, from the last one in sidebar order
  const folded = useMemo(() => {
    const cost = (item: NavItem, index: number) =>
      (heights[item.id] ?? 0) +
      2 +
      // a divider and its 2px gap
      (index > 0 && visible[index - 1].section !== item.section ? DIVIDER_HEIGHT + 2 : 0)
    if (!Number.isFinite(available) || visible.some((item) => heights[item.id] === undefined))
      return new Set<string>()
    const total = visible.reduce((sum, item, index) => sum + cost(item, index), 0)
    if (total <= available) return new Set<string>()
    let used = MORE_HEIGHT + 2
    const fit = new Set<string>()
    for (const [index, item] of visible.entries()) {
      if (used + cost(item, index) > available) break
      fit.add(item.id)
      used += cost(item, index)
    }
    return new Set(visible.filter((item) => !fit.has(item.id)).map((item) => item.id))
  }, [visible, heights, available])

  const sections = useMemo(
    () =>
      // consecutive items of a section, a divider between sections
      visible
        .filter((item) => !folded.has(item.id))
        .reduce<NavItem[][]>((groups, item) => {
          const last = groups[groups.length - 1]
          if (last && last[0].section === item.section) last.push(item)
          else groups.push([item])
          return groups
        }, []),
    [visible, folded],
  )
  const foldedItems = visible.filter((item) => folded.has(item.id))
  const moreMenuId = 'nav-rail-more'

  const renderItem = (item: NavItem) => {
    const to = itemLandingPath(item, access)
    if (!to) return null
    return (
      <RailItem
        key={item.id}
        item={item}
        to={to}
        isActive={item.id === active?.id}
        data-rail-section-item=""
      />
    )
  }

  return (
    <Styled.Rail aria-label="Sidebar" data-nav-rail ref={railRef}>
      {sections.map((section, index) => (
        <Fragment key={section[0].section}>
          {index > 0 && <Styled.Divider />}
          {section.map(renderItem)}
        </Fragment>
      ))}
      {!!foldedItems.length && (
        <>
          <Styled.MoreItem
            type="button"
            className={folded.has(active?.id ?? '') ? 'active' : undefined}
            aria-label="More"
            data-rail-item="more"
            data-tooltip={foldedItems.map((item) => item.label).join(', ')}
            data-tooltip-position="right"
            onClick={() => toggleMenuOpen(moreMenuId)}
          >
            <Icon icon="more_horiz" />
            <Styled.Label>More ({foldedItems.length})</Styled.Label>
            {/* the menu opens beside the rail */}
            <Styled.MoreAnchor ref={moreAnchorRef} />
          </Styled.MoreItem>
          <MenuContainer id={moreMenuId} target={moreAnchorRef.current} align="left">
            <Menu
              menu={foldedItems.map((item) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                // the selected item only closes the menu, as on the rail
                ...(item.id === active?.id
                  ? { onClick: () => {} }
                  : { link: itemLandingPath(item, access) }),
                selected: item.id === active?.id,
              }))}
            />
          </MenuContainer>
        </>
      )}
      <Styled.Spacer />
      {footer}
    </Styled.Rail>
  )
}

const ProjectRail = ({ projectName }: { projectName: string }) => {
  const { items } = useProjectNavigation(projectName)
  const { layout, id } = useNavLayout('project', projectName)
  return (
    <Rail
      items={items}
      layout={layout}
      layoutId={id}
      footer={<AdminDock projectName={projectName} layout={layout} />}
    />
  )
}

const StudioRail = () => {
  const { items } = useStudioNavigation()
  const { layout, id } = useNavLayout('studio')
  return <Rail items={items} layout={layout} layoutId={id} footer={<AdminDock layout={layout} />} />
}

/**
 * The sidebar: the current context's places (a project's, or Home's), the selected one owning
 * the tab row, and the admin area at the bottom. Every signed-in user but guests, who only get
 * shared pages: the items follow what the user's exposure level shows.
 */
export const NavRail = () => {
  const { pathname } = useLocation()
  const user = useAppSelector((state) => state.user)
  if (user.data?.isGuest) return null

  const projectName = pathname.match(PROJECT_PATH)?.[1]
  if (projectName) return <ProjectRail projectName={decodeURIComponent(projectName)} />
  return <StudioRail />
}

export default NavRail
