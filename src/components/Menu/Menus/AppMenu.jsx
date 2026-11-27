import styled from 'styled-components'
import { Button } from '@ynput/ayon-react-components'
import { Menu } from '@shared/components'
import { useYnputCloud } from '@components/YnputCloud/useYnputCloud'
import { useRestartOnBoardingMutation } from '@queries/onBoarding/onBoarding'
import { toast } from 'react-toastify'
import ayonClient from '@/ayon'
import { useRestart } from '@context'
import { useAppDispatch } from '@state/store'
import { toggleReleaseInstaller } from '@state/releaseInstaller'

// not connected: the menu's call to action, in Ynput Cloud's green
const CloudPrompt = styled.li`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0 2px;
  list-style: none;

  button {
    width: 100%;
    justify-content: center;
  }
  span {
    font-size: 12px;
    text-align: center;
    color: var(--md-sys-color-outline);
  }
`

// the sidebar's Admin menu (it was the apps menu in the top bar): the admin pages the sidebar
// doesn't show as items (`places`), then the server's actions and its Ynput Cloud connection
export const AppMenu = ({ user, places, ...props }) => {
  const dispatch = useAppDispatch()
  const isAdmin = user?.data?.isAdmin
  const developerMode = user?.attrib.developerMode

  // signing in to Ynput Cloud comes back to this page with the menu open (/appMenu)
  const cloud = useYnputCloud({ redirect: location.pathname + '/appMenu', enabled: !!isAdmin })

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

  const items = [...places]
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

  // the row is there from the start, so the menu keeps the height it opened with; it waits while a
  // sign-in that came back is exchanged
  if (isAdmin)
    addGroup([
      cloud.isLoading || cloud.isLoadingConnect
        ? { id: 'cloud', label: 'Ynput Cloud', icon: 'cloud', disabled: true }
        : cloud.isConnected
        ? {
            id: 'cloud',
            label: 'Ynput Cloud',
            icon: 'cloud_done',
            shortcut: 'Connected',
            shortcutStyle: {
              backgroundColor: 'var(--md-sys-color-tertiary)',
              color: 'var(--md-sys-color-on-tertiary)',
            },
            items: [
              ...[
                cloud.productName,
                cloud.connectData?.orgName && `Organization: ${cloud.connectData.orgName}`,
                cloud.connectData?.instanceName && `Instance: ${cloud.connectData.instanceName}`,
              ]
                .filter(Boolean)
                .map((label, index) => ({ id: `cloud-info-${index}`, label, disabled: true })),
              {
                id: 'cloud-account',
                label: 'Ynput Cloud Account',
                icon: 'open_in_new',
                link: `https://ynput.cloud/orgs/${cloud.connectData?.orgId}`,
                target: '_blank',
              },
              { id: 'divider' },
              {
                id: 'cloud-disconnect',
                label: 'Disconnect',
                icon: 'link_off',
                onClick: () => cloud.disconnect(),
              },
            ],
          }
        : {
            id: 'cloud',
            node: (
              <CloudPrompt key="cloud">
                <Button variant="tertiary" icon="cloud" onClick={cloud.handleConnect}>
                  Connect to Ynput Cloud
                </Button>
                <span>Addon market, release bundles and updates</span>
              </CloudPrompt>
            ),
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

  return <Menu menu={items} {...props} footer={ayonClient.settings?.version} />
}

export default AppMenu
