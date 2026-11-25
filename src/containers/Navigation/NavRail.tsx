import { Fragment, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
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
import { useAdminNavigation } from './useSettingsNavigation'
import type { NavItem } from './types'
import * as Styled from './NavRail.styled'

// the project path a page is on: the project rail shows there, Home's rail everywhere else
const PROJECT_PATH = /^\/projects\/([^/]+)/

interface RailProps {
  items: NavItem[]
  /** pinned to the bottom, after the sections */
  bottom?: NavItem[]
}

// what folds into More: the rail's divider (with its margins) and an item's height
const DIVIDER_HEIGHT = 9
const MORE_HEIGHT = 54

const Rail = ({ items, bottom = [] }: RailProps) => {
  const { pathname } = useLocation()
  const access = useNavAccess()
  const { toggleMenuOpen } = useMenuContext()
  const railRef = useRef<HTMLElement>(null)
  const moreAnchorRef = useRef<HTMLSpanElement>(null)

  const visible = useMemo(() => sortForSidebar(filterNavigation(items, access)), [items, access])
  const pinned = useMemo(() => filterNavigation(bottom, access), [bottom, access])
  const active = findActiveItem([...items, ...bottom], pathname)

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

  const renderItem = (item: NavItem, place: 'section' | 'pinned') => {
    const isActive = item.id === active?.id
    // the item's landing page; the selected item stays where it is (a page may have changed the
    // URL without the router), so its click does nothing and only a new browser tab uses this
    const to = itemLandingPath(item, access)
    if (!to) return null
    return (
      <Styled.Item
        key={item.id}
        to={to}
        className={isActive ? 'active' : undefined}
        aria-current={isActive ? 'page' : undefined}
        onClick={isActive ? (e) => e.preventDefault() : undefined}
        aria-label={item.label}
        data-rail-item={item.id}
        data-rail-section-item={place === 'section' ? '' : undefined}
        data-rail-pinned={place === 'pinned' ? '' : undefined}
        data-tooltip={item.label}
        data-tooltip-position="right"
        {...item.tags}
      >
        <Icon icon={item.icon} />
        <Styled.Label>{item.label}</Styled.Label>
      </Styled.Item>
    )
  }

  return (
    <Styled.Rail aria-label="Sidebar" data-nav-rail ref={railRef}>
      {sections.map((section, index) => (
        <Fragment key={section[0].section}>
          {index > 0 && <Styled.Divider />}
          {section.map((item) => renderItem(item, 'section'))}
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
      {pinned.map((item) => renderItem(item, 'pinned'))}
    </Styled.Rail>
  )
}

const ProjectRail = ({ projectName }: { projectName: string }) => {
  const { items } = useProjectNavigation(projectName)
  const bottom: NavItem[] = useMemo(
    () => [
      {
        id: 'project-settings',
        label: 'Settings',
        icon: 'settings',
        section: 'admin',
        // the Project manager, on this project
        tabs: [
          {
            name: 'Project settings',
            path: `/manageProjects/projectSettings?project=${encodeURIComponent(projectName)}`,
            module: 'projectSettings',
          },
        ],
      },
    ],
    [projectName],
  )
  return <Rail items={items} bottom={bottom} />
}

const StudioRail = () => {
  const { items } = useStudioNavigation()
  const admin = useAdminNavigation()
  const all = useMemo(() => [...items, ...admin], [items, admin])
  return <Rail items={all} />
}

/**
 * The sidebar: the current context's places (a project's, or Home's), the selected one owning
 * the tab row. Signed-in users from the regular user level up; guests only get shared pages.
 */
export const NavRail = () => {
  const { pathname } = useLocation()
  const user = useAppSelector((state) => state.user)
  if (user.data?.isGuest || (user.uiExposureLevel ?? 0) < 500) return null

  const projectName = pathname.match(PROJECT_PATH)?.[1]
  if (projectName) return <ProjectRail projectName={decodeURIComponent(projectName)} />
  return <StudioRail />
}

export default NavRail
