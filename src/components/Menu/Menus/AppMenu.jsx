import { Menu } from '@shared/components'
import YnputConnector from '@components/YnputCloud/YnputConnector'
import { useRestartOnBoardingMutation } from '@queries/onBoarding/onBoarding'
import { toast } from 'react-toastify'
import ayonClient from '@/ayon'
import { useRestart } from '@context/RestartContext'
import { useAppDispatch } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'

export const AppMenu = ({ user, ...props }) => {
  const dispatch = useAppDispatch()
  // check if user is logged in and is manager or admin
  const isUser = user?.data?.isUser
  const isManager = user?.data?.isManager
  const isAdmin = user?.data?.isAdmin
  const developerMode = user?.attrib.developerMode

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

  const handleReleaseInstaller = () => {
    // open menu
    dispatch(toggleReleaseInstaller({ open: true }))
  }

  const items = [
    {
      id: 'projectsManager',
      link: '/manageProjects/projectSettings',
      label: 'Projects Settings',
      icon: 'settings_applications',
      shortcut: 'P+P',
    },
  ]

  if (isUser)
    items.unshift({
      id: 'siteSettings',
      link: '/settings/site',
      label: 'Site Settings',
      icon: 'computer',
      shortcut: 'S+S',
    })

  if (!isUser)
    items.unshift({
      id: 'settings',
      link: '/settings/studio',
      label: 'Studio Settings',
      icon: 'settings',
      shortcut: 'S+S',
    })

  const managerItems = [
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
  if (isManager || isAdmin) items.push(...managerItems)

  const adminItems = [
    {
      id: 'divider',
    },
    {
      id: 'market',
      link: '/market',
      label: 'Market',
      icon: 'store',
      shortcut: 'M+M',
    },
    {
      id: 'releases',
      label: 'Update Pipeline',
      onClick: handleReleaseInstaller,
      icon: 'valve',
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

  const developerItems = [
    {
      id: 'divider',
    },
    {
      id: 'onboarding',
      label: 'Launch Bootstrap Setup',
      onClick: handleBootstrapLaunch,
      icon: 'verified_user',
      isDev: true,
    },
  ]
  // if developer add dev items
  if (developerMode) {
    items.push(...developerItems)
  }

  return (
    <>
      <Menu menu={items} {...props} footer={ayonClient.settings?.version} />
      {isAdmin && (
        <YnputConnector
          redirect={location.pathname + '/appMenu'}
          smallLogo
          darkMode
          showStudioLink
        />
      )}
    </>
  )
}

export default AppMenu
