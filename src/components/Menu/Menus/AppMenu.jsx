import { Menu } from '@shared/components'
import YnputConnector from '@components/YnputCloud/YnputConnector'
import { useRestartOnBoardingMutation } from '@queries/onBoarding/onBoarding'
import { toast } from 'react-toastify'
import ayonClient from '@/ayon'
import { useRestart } from '@context'
import { useAppDispatch } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'

// the sidebar's Admin menu (it was the apps menu in the top bar): the admin pages the sidebar
// doesn't show as items (`places`), then the server's actions
export const AppMenu = ({ user, places, ...props }) => {
  const dispatch = useAppDispatch()
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
      toast.error('Failed to launch bootstrap setup')
    }
  }

  const handleReleaseInstaller = () => {
    // open menu
    dispatch(toggleReleaseInstaller({ open: true }))
  }

  const items = [...(places || [])]
  // a group of actions, after a divider
  const addGroup = (group) => {
    if (items.length) items.push({ id: 'divider' })
    items.push(...group)
  }

  if (isAdmin)
    addGroup([
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
    ])

  if (developerMode)
    addGroup([
      {
        id: 'onboarding',
        label: 'Launch Bootstrap Setup',
        onClick: handleBootstrapLaunch,
        icon: 'verified_user',
        isDev: true,
      },
    ])

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
