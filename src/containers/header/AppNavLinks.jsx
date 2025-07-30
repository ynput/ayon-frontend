import { Button, Spacer } from '@ynput/ayon-react-components'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as Styled from './AppNavLinks.styled'
import Typography from '@/theme/typography.module.css'
import { replaceQueryParams } from '@helpers/url'
import { ayonUrlParam } from '@/constants'
import { getViewsPortalId } from '@shared/components/Views/utils/portalUtils'

const AppNavLinks = ({ links = [], currentModule, projectName }) => {
  // item = { name: 'name', path: 'path', node: node | 'spacer', accessLevel: [] }
  const navigate = useNavigate()
  const { module } = useParams()
  const [search] = useSearchParams()
  const isManager = useSelector((state) => state.user.data.isManager)
  const isAdmin = useSelector((state) => state.user.data.isAdmin)
  const uri = useSelector((state) => state.context.uri)

  const appendUri = (path, shouldAddUri = true) => {
    if (!path) return path

    // Get the base path and existing query parameters
    const [basePath, queryString] = path.split('?')

    // Only add the uri parameter when shouldAddUri is true and uri exists
    if (shouldAddUri && uri) {
      search.set(ayonUrlParam, encodeURIComponent(uri))
    }

    // Rebuild the URL with all parameters
    const newQueryString = search.toString()
    return newQueryString ? `${basePath}?${newQueryString}` : basePath
  }

  const access = {
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
              module,
              viewType,
              ...props
            } = {},
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

            const isActive = module === currentModule

            return (
              <Styled.NavItem key={idx} data-shortcut={shortcut} data-tooltip={tooltip} {...props}>
                <NavLink to={appendUri(path, uriSync)}>
                  <Button
                    variant="nav"
                    style={{ border: 'none' }}
                    className={Typography.titleSmall}
                    tabIndex={-1}
                  >
                    {startContent && startContent}
                    {name}
                    {viewType && <Styled.Views id={getViewsPortalId(viewType)} />}
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
