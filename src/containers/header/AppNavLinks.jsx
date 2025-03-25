import { Button, Spacer } from '@ynput/ayon-react-components'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import * as Styled from './AppNavLinks.styled'
import Typography from '@/theme/typography.module.css'
import { replaceQueryParams } from '@helpers/url'
import { ayonUrlParam } from '@/constants'

const AppNavLinks = ({ links = [] }) => {
  // item = { name: 'name', path: 'path', node: node | 'spacer', accessLevel: [] }
  const navigate = useNavigate()
  const { module } = useParams()
  const isManager = useSelector((state) => state.user.data.isManager)
  const isAdmin = useSelector((state) => state.user.data.isAdmin)
  const uri = useSelector((state) => state.context.uri)

  const appendUri = (path) =>
    uri ? replaceQueryParams(path, { [ayonUrlParam]: encodeURIComponent(uri) }) : path

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
              startContent,
              endContent,
              uriSync,
              ...props
            } = {},
            idx,
          ) => {
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
                <NavLink to={uriSync ? appendUri(path) : path}>
                  <Button variant="nav" className={Typography.titleSmall} tabIndex={-1}>
                    {startContent && startContent}
                    {name}
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
