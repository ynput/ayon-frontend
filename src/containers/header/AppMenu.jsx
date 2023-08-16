import ayonClient from '/src/ayon'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Divider, Spacer } from '@ynput/ayon-react-components'
import { Sidebar } from 'primereact/sidebar'
import { useSelector } from 'react-redux'
import styled, { css } from 'styled-components'
import { Fragment } from 'react'
import InstallerDownload from '/src/components/InstallerDownload/InstallerDownload'
import { useLogOutMutation } from '/src/services/auth/getAuth'
import YnputConnector from '/src/components/YnputConnect/YnputConnector'

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

const AppMenu = ({ visible, onHide }) => {
  // LOGOUT USER
  const [logout] = useLogOutMutation()
  const navigate = useNavigate()
  const location = useLocation()
  // get user from redux store
  const user = useSelector((state) => state.user)
  // check if user is logged in and is manager or admin
  const isUser = user.data.isUser
  const isAdmin = user.data.isAdmin

  const divider = <Divider style={{ margin: '10px 0' }} />
  const versionInfo = (
    <Divider style={{ margin: '10px 0' }}>{`v${ayonClient.settings?.version}`}</Divider>
  )
  const spacer = <Spacer />

  const allLinks = [
    {
      link: '/settings',
      label: 'Settings',
      icon: 'settings',
    },
    { node: divider },
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
    {
      node: <InstallerDownload />,
    },
    { node: divider },
    {
      link: 'https://community.ynput.io/',
      label: 'Community Forum',
      icon: 'forum',
    },
    {
      link: 'https://github.com/ynput/ayon-frontend/issues/new',
      label: 'Report a Bug',
      icon: 'bug_report',
    },
  ]

  const protectedLinks = [
    { node: <YnputConnector redirect={location.pathname + '/appMenu'} smallLogo /> },
    { node: divider },
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
    { node: divider },
  ]

  // add protected links if user is manager or admin
  if (!isUser) allLinks.push(...protectedLinks)

  const logoutItem = {
    label: 'Logout',
    icon: 'logout',
    onClick: logout,
  }

  allLinks.push(logoutItem)

  const protectedBottomLinks = [
    {
      node: spacer,
    },
    {
      node: versionInfo,
    },
    {},
  ]

  // add protected links if user is manager or admin
  if (!isUser) allLinks.push(...protectedBottomLinks)

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

  if (!visible) return null

  return (
    <Sidebar position="right" visible={visible} onHide={onHide}>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 4,
          gap: 8,
        }}
      >
        {allLinks.map(({ icon, link, label, onClick, node }, i) =>
          label ? (
            <StyledButton
              key={`${label}-${i}`}
              onClick={() => {
                if (link) {
                  if (link.includes('http')) window.open(link, '_blank')
                  onHide()
                  navigate(link)
                } else if (onClick) onClick()
              }}
              label={label}
              icon={icon}
              isActive={location.pathname.includes(link)}
            />
          ) : (
            node && <Fragment key={`${node.displayName}-${i}`}>{node}</Fragment>
          ),
        )}
      </div>
    </Sidebar>
  )
}

export default AppMenu
