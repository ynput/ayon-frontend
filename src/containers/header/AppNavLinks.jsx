import { Spacer } from '@ynput/ayon-react-components'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { NavLink, useNavigate, useParams } from 'react-router-dom'

const AppNavLinks = ({ links = [] }) => {
  // item = { name: 'name', path: 'path', node: node | 'spacer', accessLevel: [] }
  const navigate = useNavigate()
  const { module } = useParams()
  const isManager = useSelector((state) => state.user.data.isManager)
  const isAdmin = useSelector((state) => state.user.data.isAdmin)

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
    <nav className="secondary">
      {links.map((item, idx) => {
        // if item has restrictions, check if user has access
        let hasAccess = true
        if (item.accessLevels?.length) {
          hasAccess = item.accessLevels?.every((restriction) => access[restriction])
        }
        if (!hasAccess) return null

        // return spacer if item is a spacer, or just the node
        if (item.node) {
          // if item is a node a spacer, return spacer
          if (item.node === 'spacer') {
            return <Spacer key={idx} />
          } else return <div key={idx}>{item.node}</div>
        }

        return (
          <NavLink key={idx} to={item.path}>
            {item.name}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default AppNavLinks
