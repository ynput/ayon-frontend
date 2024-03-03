import ayonClient from '/src/ayon'
import Menu from '../MenuComponents/Menu'
import { confirmDialog } from 'primereact/confirmdialog'
import { useRestartServerMutation } from '/src/services/restartServer'
import YnputConnector from '/src/components/YnputCloud/YnputConnector'
import { useRestartOnBoardingMutation } from '/src/services/onBoarding/onBoarding'
import { toast } from 'react-toastify'
import useLocalStorage from '/src/hooks/useLocalStorage'
import { UserMenu } from '.'
import { useLogOutMutation } from '/src/services/auth/getAuth'

export const AppMenu = ({ user, ...props }) => {
  // check if user is logged in and is manager or admin
  const isUser = user.data.isUser
  const isAdmin = user.data.isAdmin

  // restart server
  const [restartServer] = useRestartServerMutation()
  /* eslint-disable-next-line */
  const [restartConfig, setRestartConfig] = useLocalStorage('restart', null)

  const handleServerRestart = async () => {
    confirmDialog({
      message: 'Are you sure you want to restart the server?',
      header: 'Restart Server',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log(restartConfig)
        setRestartConfig(null)
        restartServer()
      },
      reject: () => {},
    })
  }

  // onboarding restart
  const [restartOnBoarding] = useRestartOnBoardingMutation()

  const handleBootstrapLaunch = async () => {
    try {
      await restartOnBoarding().unwrap()
      window.location.reload()
    } catch (error) {
      console.error(error)
      toast.error('Failed to launch bootstrap setup')
    }
  }

  // sign out
  const [logout] = useLogOutMutation()

  const handleLogOut = () => {
    // onClose && onClose()
    logout()
  }

  const items = [
    {
      id: 'account',
      link: '/account/profile',
      label: 'Account',
      icon: 'person',
    },
  ]

  const managerItems = [
    { id: 'divider' },
    {
      id: 'settings',
      link: '/settings/bundles',
      label: 'Studio Settings',
      icon: 'settings',
      shortcut: 'S+S',
    },
    {
      id: 'projectsManager',
      link: '/manageProjects/anatomy',
      label: 'Projects Settings',
      icon: 'settings_applications',
      shortcut: 'P+P',
    },
    {
      id: 'market',
      link: '/market',
      label: 'Addon Market',
      icon: 'store',
    },
    {
      id: 'events',
      link: '/events',
      label: 'Event Viewer',
      icon: 'history',
      shortcut: 'E+E',
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
      id: 'onboarding',
      label: 'Launch Bootstrap Setup',
      onClick: handleBootstrapLaunch,
      icon: 'verified_user',
    },
    {
      id: 'restart',
      label: 'Restart Server',
      icon: 'restart_alt',
      onClick: handleServerRestart,
    },
  ]

  // add protected items if user is admin
  if (isAdmin) items.push(...adminItems)

  // final user items (sign out)
  const finalItems = [
    {
      id: 'divider',
    },
    {
      id: 'signOut',
      label: 'Sign out',
      icon: 'logout',
      onClick: handleLogOut,
    },
  ]

  // add final items for all users
  items.push(...finalItems)

  return (
    <>
      <Menu
        menu={items}
        header={<UserMenu user={user} />}
        footer={!isUser && ayonClient.settings?.version}
        {...props}
      />
      {isAdmin && (
        <YnputConnector
          redirect={location.pathname + '/appMenu'}
          smallLogo
          darkMode
          showDisconnect={false}
        />
      )}
    </>
  )
}

export default AppMenu
