import ayonClient from '/src/ayon'
import InstallerDownload from '/src/components/InstallerDownload/InstallerDownload'
import Menu from '../MenuComponents/Menu'
import { confirmDialog } from 'primereact/confirmdialog'
import { useRestartServerMutation } from '/src/services/restartServer'
// import YnputConnector from '/src/components/YnputConnect/YnputConnector'

export const AppMenu = ({ user, ...props }) => {
  // check if user is logged in and is manager or admin
  const isUser = user.data.isUser
  const isAdmin = user.data.isAdmin

  const [restartServer] = useRestartServerMutation()

  const items = [
    {
      id: 'settings',
      link: '/settings/bundles',
      label: 'Settings',
      icon: 'settings',
      highlighted: true,
    },
    // this is weird I know, instead of returning a node, we return a menu object with sub menus
    InstallerDownload({ isMenu: true }),
  ]

  const managerItems = [
    { id: 'divider' },
    {
      id: 'events',
      link: '/events',
      label: 'Event Viewer',
      icon: 'history',
    },
    {
      id: 'services',
      link: '/services',
      label: 'Services',
      icon: 'home_repair_service',
    },
  ]

  // add protected items if user is manager or admin
  if (!isUser) items.push(...managerItems)

  const adminItems = [
    {
      id: 'divider',
    },
    {
      id: 'restart',
      label: 'Restart Server',
      icon: 'restart_alt',
      onClick: () => {
        confirmDialog({
          message: 'Are you sure you want to restart the server?',
          header: 'Restart Server',
          icon: 'pi pi-exclamation-triangle',
          accept: () => {
            restartServer()
          },
          reject: () => {},
        })
      },
    },
  ]

  // { node: <YnputConnector redirect={location.pathname + '/appMenu'} smallLogo /> },

  // add protected items if user is admin
  if (isAdmin) items.push(...adminItems)

  return (
    <>
      <Menu menu={items} footer={ayonClient.settings?.version} {...props} />
    </>
  )
}

export default AppMenu
