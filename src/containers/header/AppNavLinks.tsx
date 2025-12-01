import { Button, Spacer } from '@ynput/ayon-react-components'
import { FC, ReactNode, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as Styled from './AppNavLinks.styled'
import Typography from '@/theme/typography.module.css'
import { getViewsPortalId } from '@shared/containers/Views/utils/portalUtils'
import { LegacyBadge } from '@shared/components'
import { useURIContext } from '@shared/context'

interface NavLinkItem {
  name: string
  path: string
  module: string
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

      if (firstItem) {
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
              module: itemModule,
              viewType,
              deprecated,
              ...props
            }: Partial<NavLinkItem> = {},
            idx,
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
                <NavLink to={path!}>
                  <Button
                    variant="nav"
                    style={{ border: 'none' }}
                    className={Typography.titleSmall}
                    tabIndex={-1}
                  >
                    {startContent && startContent}
                    {name}
                    {viewType && <Styled.Views id={getViewsPortalId(viewType as any)} />}
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
