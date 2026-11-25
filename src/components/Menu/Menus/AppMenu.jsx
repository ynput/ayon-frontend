import { Menu } from '@shared/components'
import YnputConnector from '@components/YnputCloud/YnputConnector'
import { useRestartOnBoardingMutation } from '@queries/onBoarding/onBoarding'
import { toast } from 'react-toastify'
import ayonClient from '@/ayon'
import { useRestart } from '@context'
import { useAppDispatch } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'

export const AppMenu = ({ user, ...props }) => {
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

  // the pages it used to link to are in Home's sidebar: what's left are the server's actions
  const items = []

  const adminItems = [
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
    ...(isAdmin ? [{ id: 'divider' }] : []),
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
