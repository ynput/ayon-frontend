import { useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { NavLink } from 'react-router-dom'
import { Menu } from 'primereact/menu'

import axios from 'axios'

import { Button, Spacer } from '../components'

const NavBar = () => {
  const user = useSelector((state) => ({ ...state.userReducer }))
  const context = useSelector((state) => ({ ...state.contextReducer }))
  const dispatch = useDispatch()
  const menu = useRef(null)
  const projectName = context.projectName

  const logout = () => {
    axios
      .post('/api/auth/logout')
      .then((response) => {
        toast.info(response.data.detail)
        dispatch({ type: 'LOGOUT' })
      })
      .catch(() => {
        toast.error('Unable to log out. Weird.')
      })
  }

  const menuModel = useMemo(() => {
    return [
      {
        label: 'Developer',
        items: [
          {
            label: 'GraphQL explorer',
            icon: 'pi pi-sitemap',
            command: () => {
              window.location.href = '/explorer'
            },
          },
          {
            label: 'REST API docs',
            icon: 'pi pi-book',
            url: '/doc/api',
          },
        ],
      },
      {
        label: 'Account',
        items: [
          {
            label: 'Options',
            icon: 'pi pi-fw pi-cog',
            command: () => {
              window.location.href = '/profile'
            },
          },
          {
            label: 'Sign Out',
            icon: 'pi pi-fw pi-power-off',
            command: logout,
          },
        ],
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const navBar = useMemo(() => {
    return (
      <nav>
        <NavLink to="/projects">Projects</NavLink>
        {projectName && (
          <>
            <NavLink to={`/browser/${projectName}`}>Browser</NavLink>
            <NavLink to={`/manager/${projectName}`}>Manager</NavLink>
            <NavLink to={`/sitesync/${projectName}`}>Site Sync</NavLink>
          </>
        )}

        <NavLink to="/explorer">GraphQL Explorer</NavLink>
        <NavLink to="/doc/api">REST API docs</NavLink>

        <Spacer />

        <Menu model={menuModel} popup ref={menu} />
        <Button
          className="p-button-link p-button-info"
          label={user.name}
          icon="pi pi-user"
          onClick={(event) => menu.current.toggle(event)}
        />
      </nav>
    )
  }, [projectName, user.name, menuModel])

  return navBar
}

export default NavBar
