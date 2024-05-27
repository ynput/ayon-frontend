import Menu from '../MenuComponents/Menu'
import YnputConnector from '/src/components/YnputCloud/YnputConnector'
import { useRestartOnBoardingMutation } from '/src/services/onBoarding/onBoarding'
import { toast } from 'react-toastify'
import ayonClient from '/src/ayon'
import { useRestart } from '/src/context/restartContext'

export const AppMenu = ({ user, ...props }) => {
  // check if user is logged in and is manager or admin
  const isUser = user?.data?.isUser
  const isAdmin = user?.data?.isAdmin

  // restart server
  const { confirmRestart, isRestartRequired } = useRestart()

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

  const items = [
    {
      id: 'projectsManager',
      link: '/manageProjects/anatomy',
      label: 'Projects Settings',
      icon: 'settings_applications',
      shortcut: 'P+P',
    },
  ]

  if (!isUser)
    items.unshift({
      id: 'settings',
      link: '/settings/bundles',
      label: 'Studio Settings',
      icon: 'settings',
      shortcut: 'S+S',
    })

  const managerItems = [
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
      shortcut: 'V+V',
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
      label: isRestartRequired ? 'Restart Required' : 'Restart Server',
      icon: 'restart_alt',
      onClick: confirmRestart,
      highlighted: isRestartRequired,
      notification: isRestartRequired,
    },
  ]

  // add protected items if user is admin
  if (isAdmin) items.push(...adminItems)

  return (
    <>
      <Menu menu={items} {...props} footer={!isUser && ayonClient.settings?.version} />
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
