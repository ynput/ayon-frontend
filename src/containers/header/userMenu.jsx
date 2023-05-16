import axios from 'axios'

import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Spacer, UserImage } from '@ynput/ayon-react-components'
import { Sidebar } from 'primereact/sidebar'
import { logout } from '/src/features/user'
import { useSelector } from 'react-redux'
import { ayonApi } from '/src/services/ayon'
import styled, { css } from 'styled-components'

const StyledButton = styled(Button)`
  width: 100%;
  padding: 8px 12px;
  /* height: 100%; */
  max-height: unset;

  justify-content: start;
  gap: 8px;

  /* isActive */
  ${({ isActive }) =>
    isActive &&
    css`
      background-color: var(--color-row-hl);

      &:hover {
        background-color: var(--color-row-hl);
      }
    `}
`

const UserMenu = ({ visible, onHide }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  // get user from redux store
  const user = useSelector((state) => state.user)
  // check if user is logged in and is manager or admin
  const isUser = user.data.isUser
  const isAdmin = user.data.isAdmin

  console.log('IsAdmin: ', isAdmin)

  const doLogout = () => {
    axios
      .post('/api/auth/logout')
      .then((response) => {
        toast.info(response.data.detail)
        dispatch(logout())
        // reset global state
        dispatch(ayonApi.util.resetApiState())
      })
      .catch(() => {
        toast.error('Unable to log out. Weird.')
      })
  }

  const allLinks = [
    {
      link: '/settings',
      label: 'Settings',
      icon: 'settings',
    },
    {
      link: '/manageProjects',
      label: 'Manage Projects',
      icon: 'settings_suggest',
    },
    {
      link: '/doc/api',
      label: 'REST API Docs',
      icon: 'help',
    },
    {
      link: '/explorer',
      label: 'GraphQL Explorer',
      icon: 'account_tree',
    },
  ]

  const protectedLinks = [
    {
      link: '/events',
      label: 'Event Viewer',
      icon: 'history',
    },
    {
      link: '/services',
      label: 'Services',
      icon: 'home_repair_service',
    },
  ]

  // add protected links if user is manager or admin
  if (!isUser) allLinks.push(...protectedLinks)

  // server restart is only available to admins
  if (isAdmin)
    allLinks.push({
      onClick: () =>
        axios.post('/api/system/restart').finally(() => {
          onHide()
        }),
      label: 'Restart Server',
      icon: 'restart_alt',
    })

  return (
    <Sidebar position="right" visible={visible} onHide={onHide} icons={() => <h3>User menu</h3>}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 4,
          gap: 8,
        }}
      >
        <StyledButton
          onClick={() => navigate('/profile')}
          isActive={location.pathname.includes('/profile')}
        >
          <UserImage size={19.5} src={user?.attrib?.avatarUrl} fullName={user?.attrib?.fullName} />
          Profile ({user.name})
        </StyledButton>
        {allLinks.map(({ icon, link, label, onClick }, i) => (
          <StyledButton
            key={`${label}-${i}`}
            onClick={() => {
              if (link) navigate(link)
              else if (onClick) onClick()
            }}
            label={label}
            icon={icon}
            isActive={location.pathname.includes(link)}
          />
        ))}
        <Spacer />
        <StyledButton
          style={{ justifyContent: 'center' }}
          onClick={doLogout}
          label="Sign Out"
          icon="logout"
        />
      </div>
    </Sidebar>
  )
}

export default UserMenu
