import { Button, Spacer } from '@ynput/ayon-react-components'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as Styled from './AppNavLinks.styled'
import Typography from '@/theme/typography.module.css'
import { replaceQueryParams } from '@helpers/url'
import { ayonUrlParam } from '@/constants'
import { getViewsPortalId } from '@shared/containers/Views/utils/portalUtils'

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
  
  const activeModule = currentModule || module
  const currentPageLink = links.find(link => link.module === activeModule)
  const currentPageName = currentPageLink?.name
  
  
  const spacerIndex = links.findIndex(link => link.node === 'spacer')
  const scrollableLinks = spacerIndex >= 0 ? links.slice(0, spacerIndex) : links
  const fixedButtons = spacerIndex >= 0 ? links.slice(spacerIndex + 1) : []

  const renderLinkItem = (linkData, idx, isFixedButton = false) => {
    const {
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
    } = linkData || {}

    if (!enabled) return null
  
    let hasAccess = true
    if (accessLevels?.length) {
      hasAccess = accessLevels?.every((restriction) => access[restriction])
    }
    if (!hasAccess) return null


    if (node && node !== 'spacer') {
      return isFixedButton ? (
        <React.Fragment key={idx}>{node}</React.Fragment>
      ) : (
        <li key={idx}>{node}</li>
      )
    }

    const isActive = module === currentModule

    const linkContent = (
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
    )

    return isFixedButton ? (
      <React.Fragment key={idx}>{linkContent}</React.Fragment>
    ) : (
      <Styled.NavItem key={idx} data-shortcut={shortcut} data-tooltip={tooltip} {...props}>
        {linkContent}
      </Styled.NavItem>
    )
  }

  return (
    <Styled.NavBar className="secondary">
      <div className="scrollable-tabs">
        <ul>
          {scrollableLinks.map((link, idx) => renderLinkItem(link, idx, false))}
        </ul>
      </div>
      {fixedButtons.length > 0 && (
        <div className="fixed-buttons">
          {fixedButtons.map((link, idx) => renderLinkItem(link, idx, true))}
        </div>
      )}
    </Styled.NavBar>
  )
}

export default AppNavLinks
