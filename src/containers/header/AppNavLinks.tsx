import { Button } from '@ynput/ayon-react-components'
import { FC, ReactNode, WheelEvent, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as Styled from './AppNavLinks.styled'
import { useHorizontalOverflow } from './useHorizontalOverflow'
import Typography from '@/theme/typography.module.css'
import { getViewsPortalId } from '@shared/containers/Views/utils/portalUtils'
import { LegacyBadge } from '@shared/components'
import { useURIContext } from '@shared/context'

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

  // tabs scroll; items after the spacer (help, more) stay pinned to the right
  const spacerIndex = links.findIndex((item) => item.node === 'spacer')
  const tabs = spacerIndex === -1 ? links : links.slice(0, spacerIndex)
  const trailing = spacerIndex === -1 ? [] : links.slice(spacerIndex + 1)

  const tabsRef = useRef<HTMLUListElement>(null)
  const { overflowing, canScrollStart, canScrollEnd, scrollByPage } = useHorizontalOverflow(tabsRef)

  const { pathname } = useLocation()
  useEffect(() => {
    const list = tabsRef.current
    const active = list?.querySelector<HTMLElement>('a.active')
    if (!list || !active) return
    const start = active.offsetLeft - Styled.TAB_FADE_PX
    const end = active.offsetLeft + active.offsetWidth + Styled.TAB_FADE_PX
    if (start < list.scrollLeft) list.scrollLeft = start
    else if (end > list.scrollLeft + list.clientWidth) list.scrollLeft = end - list.clientWidth
  }, [pathname, overflowing])

  const handleWheel = (e: WheelEvent<HTMLUListElement>) => {
    if (!overflowing || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return
    e.currentTarget.scrollLeft += e.deltaY
  }

  const renderItem = (
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
    idx: number,
  ) => {
    if (!enabled) return null
    // if item has restrictions, check if user has access
    let hasAccess = true
    if (accessLevels?.length) {
      hasAccess = accessLevels?.every((restriction) => access[restriction])
    }
    if (!hasAccess) return null

    if (node && node !== 'spacer') return <li key={idx}>{node}</li>
    if (node) return null

    return (
      <Styled.NavItem key={idx} data-shortcut={shortcut} data-tooltip={tooltip} {...props}>
        <NavLink to={path!}>
          <Button
            variant="nav"
            style={{ border: 'none' }}
            className={Typography.titleSmall}
            tabIndex={-1}
          >
            {startContent && startContent}
            {name}
            {deprecated && (
              <LegacyBadge tooltip={typeof deprecated === 'string' ? deprecated : undefined} />
            )}
            {endContent && endContent}
            {viewType && <Styled.Views id={getViewsPortalId(viewType as any)} />}
          </Button>
        </NavLink>
      </Styled.NavItem>
    )
  }

  return (
    <Styled.NavBar className="secondary">
      <Styled.TabsScroller>
        {overflowing && (
          <Button
            icon="chevron_left"
            variant="text"
            disabled={!canScrollStart}
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll tabs left"
          />
        )}
        <Styled.Tabs
          ref={tabsRef}
          onWheel={handleWheel}
          data-fade-start={canScrollStart}
          data-fade-end={canScrollEnd}
        >
          {tabs.map(renderItem)}
        </Styled.Tabs>
        {overflowing && (
          <Button
            icon="chevron_right"
            variant="text"
            disabled={!canScrollEnd}
            onClick={() => scrollByPage(1)}
            aria-label="Scroll tabs right"
          />
        )}
      </Styled.TabsScroller>
      {!!trailing.length && <Styled.Trailing>{trailing.map(renderItem)}</Styled.Trailing>}
    </Styled.NavBar>
  )
}

export default AppNavLinks
