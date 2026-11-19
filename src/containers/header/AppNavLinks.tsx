import { Button, Spacer } from '@ynput/ayon-react-components'
import { FC, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSelector } from 'react-redux'
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as Styled from './AppNavLinks.styled'
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

  // everything after the first spacer (help, menus) stays visible; only the tabs scroll
  const spacerIndex = links.findIndex((item) => item?.node === 'spacer')
  const tabLinks = spacerIndex === -1 ? links : links.slice(0, spacerIndex)
  const trailingLinks = spacerIndex === -1 ? [] : links.slice(spacerIndex + 1)

  const tabsRef = useRef<HTMLUListElement>(null)
  const [overflow, setOverflow] = useState({ start: false, end: false })

  const updateOverflow = () => {
    const el = tabsRef.current
    if (!el) return
    const start = el.scrollLeft > 1
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setOverflow((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }

  useLayoutEffect(() => {
    const el = tabsRef.current
    if (!el) return
    updateOverflow()
    const observer = new ResizeObserver(updateOverflow)
    observer.observe(el)
    return () => observer.disconnect()
  }, [links.length])

  // keep the active tab in view when the tabs don't fit
  useEffect(() => {
    const active = tabsRef.current?.querySelector('a.active')
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [module])

  // the scroll bar is hidden, so let a vertical wheel scroll the tabs sideways
  const handleWheel = (e: React.WheelEvent<HTMLUListElement>) => {
    const el = e.currentTarget
    if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
    el.scrollLeft += e.deltaY
  }

  const scrollTabs = (direction: 1 | -1) => {
    const el = tabsRef.current
    if (!el) return
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

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
          <Styled.NavItem key={idx} data-shortcut={shortcut} data-tooltip={tooltip} {...props}>
            <NavLink to={path!}>
              <Button
                variant="nav"
                style={{ border: 'none' }}
                className={Typography.titleSmall}
                tabIndex={-1}
              >
                {startContent && startContent}
                <span className="tab-name" data-name={name}>
                  {name}
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
    <Styled.NavBar className="secondary">
      <ul
        ref={tabsRef}
        className={clsx('tabs', {
          'overflow-start': overflow.start,
          'overflow-end': overflow.end,
        })}
        onScroll={updateOverflow}
        onWheel={handleWheel}
      >
        {renderLinks(tabLinks)}
      </ul>
      {(overflow.start || overflow.end) && (
        <Button
          variant="text"
          icon={overflow.end ? 'chevron_right' : 'chevron_left'}
          data-tooltip={overflow.end ? 'More tabs' : 'Previous tabs'}
          onClick={() => scrollTabs(overflow.end ? 1 : -1)}
        />
      )}
      {!!trailingLinks.length && (
        <ul className="trailing">{renderLinks(trailingLinks, tabLinks.length + 1)}</ul>
      )}
    </Styled.NavBar>
  )
}

export default AppNavLinks
