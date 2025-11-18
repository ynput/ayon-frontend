import { Button, Spacer } from '@ynput/ayon-react-components'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as Styled from './AppNavLinks.styled'
import Typography from '@/theme/typography.module.css'
import { ayonUrlParam } from '@/constants'
import { getViewsPortalId } from '@shared/containers/Views/utils/portalUtils'
import { LegacyBadge } from '@shared/components'
import type { ReactNode } from 'react'

export type AccessLevel = 'manager' | 'admin'

export interface NavLinkItem {
  name?: string
  path?: string
  module?: string
  accessLevels?: AccessLevel[]
  shortcut?: string
  node?: ReactNode | 'spacer'
  tooltip?: string
  enabled?: boolean
  startContent?: ReactNode
  endContent?: ReactNode
  uriSync?: boolean
  viewType?: string
  deprecated?: boolean | string
  [key: string]: any
}

interface AppNavLinksProps {
  links?: NavLinkItem[]
  currentModule?: string
  projectName?: string
}

const AppNavLinks: React.FC<AppNavLinksProps> = ({ links = [], currentModule: _currentModule }) => {
  // item = { name: 'name', path: 'path', node: node | 'spacer', accessLevel: [] }
  const navigate = useNavigate()
  const { module } = useParams<{ module?: string }>()
  const [search] = useSearchParams()
  const isManager = useSelector((state: any) => state.user.data.isManager)
  const isAdmin = useSelector((state: any) => state.user.data.isAdmin)
  const uri = useSelector((state: any) => state.context.uri)

  const appendUri = (path: string | undefined, shouldAddUri = true): string | undefined => {
    if (!path) return path

    // Get the base path and existing query parameters
    const [basePath] = path.split('?')

    // Only add the uri parameter when shouldAddUri is true and uri exists
    if (shouldAddUri && uri) {
      search.set(ayonUrlParam, encodeURIComponent(uri))
    }

    // Rebuild the URL with all parameters
    const newQueryString = search.toString()
    return newQueryString ? `${basePath}?${newQueryString}` : basePath
  }

  const access: Record<AccessLevel, boolean> = {
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

  return (
    <Styled.NavBar className="secondary">
      <ul>
        {links.map(
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
              module,
              viewType,
              deprecated,
              ...props
            }: NavLinkItem = {},
            idx: number,
          ) => {
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
                <NavLink to={appendUri(path, uriSync) || ''}>
                  <Button
                    variant="nav"
                    style={{ border: 'none' }}
                    className={Typography.titleSmall}
                    tabIndex={-1}
                  >
                    {startContent && startContent}
                    {name}
                    {viewType && <Styled.Views id={getViewsPortalId(viewType)} />}
                    {deprecated && (
                      <LegacyBadge
                        tooltip={typeof deprecated === 'string' ? deprecated : undefined}
                      />
                    )}
                    {endContent && endContent}
                  </Button>
                </NavLink>
              </Styled.NavItem>
            )
          },
        )}
      </ul>
    </Styled.NavBar>
  )
}

export default AppNavLinks
