import { Button, Icon, Spacer } from '@ynput/ayon-react-components'
import { FC, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as Styled from './AppNavLinks.styled'
import Typography from '@/theme/typography.module.css'
import { getViewsPortalId } from '@shared/containers/Views/utils/portalUtils'
import { LegacyBadge } from '@shared/components'
import { useMenuContext, useURIContext } from '@shared/context'
import { Menu, MenuContainer } from '@shared/components'

export interface NavLinkItem {
  name?: string
  path?: string
  module?: string
  node?: ReactNode | 'spacer'
  shortcut?: string
  tooltip?: string
  accessLevels?: string[]
  enabled?: boolean
  startContent?: ReactNode
  endContent?: ReactNode
  uriSync?: boolean
  viewType?: string
  deprecated?: string | boolean
  [key: string]: unknown
}

interface AppNavLinksProps {
  links?: NavLinkItem[]
  currentModule?: string
  projectName?: string
}

const AppNavLinks: FC<AppNavLinksProps> = ({ links = [] }) => {
  // item = { name: 'name', path: 'path', node: node | 'spacer', accessLevel: [] }
  const navigate = useNavigate()
  const { module } = useParams<{ module?: string }>()
  useSearchParams()
  const isManager = useSelector((state: any) => state.user.data.isManager)
  const isAdmin = useSelector((state: any) => state.user.data.isAdmin)
  useURIContext()

  const access: Record<string, boolean> = {
    manager: isManager || isAdmin,
    admin: isAdmin,
  }

  //   if module is matches an item that has accessLevel that is not in access, redirect to
  useEffect(() => {
    const item = links.find((item) => item.module === `${module}`)
    if (item && item.accessLevels?.length && !item.accessLevels?.every((level) => access[level])) {
      // find the first item that this user has access
      const firstItem = links.find((item) => item.accessLevels?.every((level) => access[level]))

      if (firstItem && firstItem.path) {
        navigate(firstItem.path)
      } else {
        // last resort, navigate to home
        navigate('/')
      }
    }
  }, [module, links, access])

  // everything after the first spacer (help, menus) stays visible; tabs that don't fit fold
  const spacerIndex = links.findIndex((item) => item?.node === 'spacer')
  const tabLinks = spacerIndex === -1 ? links : links.slice(0, spacerIndex)
  const trailingLinks = spacerIndex === -1 ? [] : links.slice(spacerIndex + 1)

  const navRef = useRef<HTMLElement>(null)
  const tabsRef = useRef<HTMLUListElement>(null)
  const trailingRef = useRef<HTMLUListElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const { pathname } = useLocation()
  const { toggleMenuOpen } = useMenuContext()

  // the tabs the user sees, by their index in tabLinks
  const shownTabs = tabLinks
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        item?.enabled !== false &&
        (!item?.accessLevels?.length || item.accessLevels.every((level) => access[level])),
    )
  const activeIndex = shownTabs.find(
    ({ item }) =>
      !!item?.path && (pathname === item.path.split('?')[0] || pathname.startsWith(item.path.split('?')[0] + '/')),
  )?.index

  // each tab's width, measured while it is in the row; the row's width for tabs
  const [widths, setWidths] = useState<Record<string, number>>({})
  const [available, setAvailable] = useState(Infinity)
  const tabKey = (index: number) => `${index}:${tabLinks[index]?.path ?? tabLinks[index]?.name}`

  const measure = () => {
    const nav = navRef.current
    if (!nav) return
    const measured: Record<string, number> = {}
    tabsRef.current?.querySelectorAll<HTMLElement>(':scope > li[data-tab-index]').forEach((li) => {
      measured[tabKey(Number(li.dataset.tabIndex))] = li.offsetWidth
    })
    // only a change re-renders: this runs after every render
    if (Object.entries(measured).some(([key, width]) => Math.abs((widths[key] ?? -1) - width) > 0.5))
      setWidths({ ...widths, ...measured })
    // the nav's padding (16) and the gaps around the trailing items
    const free = nav.clientWidth - 16 - (trailingRef.current?.offsetWidth ?? 0) - 8
    if (Math.abs(available - free) > 0.5) setAvailable(free)
  }

  useLayoutEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (navRef.current) observer.observe(navRef.current)
    // a tab grows when its page's views button moves in
    tabsRef.current?.querySelectorAll(':scope > li').forEach((li) => observer.observe(li))
    return () => observer.disconnect()
  })

  // tabs fold from the end into "+N"; the open tab always stays in the row
  const folded = useMemo(() => {
    const GAP = 4
    const MORE_WIDTH = 64
    const width = (index: number) => widths[tabKey(index)]
    if (!Number.isFinite(available) || shownTabs.some(({ index }) => width(index) === undefined))
      return new Set<number>()
    const total = shownTabs.reduce((sum, { index }) => sum + width(index) + GAP, 0)
    if (total <= available) return new Set<number>()

    const budget = available - MORE_WIDTH
    const visible: number[] = []
    let used = 0
    for (const { index } of shownTabs) {
      if (used + width(index) + GAP > budget) break
      visible.push(index)
      used += width(index) + GAP
    }
    if (activeIndex !== undefined && !visible.includes(activeIndex)) {
      used += width(activeIndex) + GAP
      while (visible.length && used > budget) used -= width(visible.pop()!) + GAP
      visible.push(activeIndex)
    }
    return new Set(shownTabs.map(({ index }) => index).filter((index) => !visible.includes(index)))
    // tabKey and shownTabs follow tabLinks, which the widths are keyed by
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widths, available, activeIndex, tabLinks, access.manager, access.admin])

  const foldedTabs = shownTabs.filter(({ index }) => folded.has(index))
  const moreMenuId = 'nav-more-tabs'

  const renderLinks = (items: NavLinkItem[], offset = 0) =>
    items.map(
      (
        {
          accessLevels,
          node,
          shortcut,
          path,
          tooltip,
          name,
          enabled = true,
          startContent,
          endContent,
          uriSync,
          module: itemModule,
          viewType,
          deprecated,
          ...props
        }: Partial<NavLinkItem> = {},
        index,
      ) => {
        const idx = index + offset
        if (!enabled) return null
        if (offset === 0 && folded.has(index)) return null
        // if item has restrictions, check if user has access
        let hasAccess = true
        if (accessLevels?.length) {
          hasAccess = accessLevels?.every((restriction) => access[restriction])
        }
        if (!hasAccess) return null

        // return spacer if item is a spacer, or just the node
        if (node) {
          // if item is a node a spacer, return spacer
          if (node === 'spacer') {
            return <Spacer key={idx} />
          } else return <li key={idx}>{node}</li>
        }

        return (
          <Styled.NavItem
            key={idx}
            data-shortcut={shortcut}
            data-tooltip={tooltip}
            data-tab-index={offset === 0 ? index : undefined}
            {...props}
          >
            <NavLink to={path!}>
              <Button
                variant="nav"
                style={{ border: 'none' }}
                className={Typography.titleSmall}
                tabIndex={-1}
              >
                {startContent && startContent}
                <span className="tab-name" data-name={name}>
                  <span className="tab-label">{name}</span>
                </span>
                {deprecated && (
                  <LegacyBadge tooltip={typeof deprecated === 'string' ? deprecated : undefined} />
                )}
                {endContent && endContent}
                {viewType && <Styled.Views id={getViewsPortalId(viewType as any)} />}
              </Button>
            </NavLink>
          </Styled.NavItem>
        )
      },
    )

  return (
    <Styled.NavBar className="secondary" ref={navRef}>
      <ul ref={tabsRef} className="tabs">
        {renderLinks(tabLinks)}
      </ul>
      {!!foldedTabs.length && (
        <>
          <Styled.MoreTabs
            ref={moreRef}
            variant="text"
            data-tooltip="More tabs"
            onClick={() => toggleMenuOpen(moreMenuId)}
          >
            +{foldedTabs.length}
            <Icon icon="expand_more" />
          </Styled.MoreTabs>
          <MenuContainer id={moreMenuId} target={moreRef.current} align="left">
            <Menu
              menu={foldedTabs.map(({ item, index }) => ({
                id: `${index}`,
                label: item.name,
                link: item.path,
              }))}
            />
          </MenuContainer>
        </>
      )}
      {!!trailingLinks.length && (
        <ul className="trailing" ref={trailingRef}>
          {renderLinks(trailingLinks, tabLinks.length + 1)}
        </ul>
      )}
    </Styled.NavBar>
  )
}

export default AppNavLinks
