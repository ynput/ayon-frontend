// Shown on an addon's splash screen when the addon is installed on the server but its page
// isn't available: it is missing from the bundle in use, or its page did not load. Also when
// the installed addons couldn't be listed, so AYON can't tell whether the addon is there.
// Unlike the PowerpackDialog this says nothing about subscriptions: the studio may well have one.

import { FC } from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon } from '@ynput/ayon-react-components'
import * as Styled from '@shared/components/Powerpack/PowerpackDialog.styled'
import { useGetCurrentUserQuery } from '@shared/api'
import { getAddonUnavailableText } from './SplashWrapperPageHelpers'
import type { AddonSplashState } from './SplashWrapperPageHelpers'

interface AddonUnavailableDialogProps {
  label?: string
  addon: { name: string; icon: string }
  state: Extract<AddonSplashState, { status: 'notInBundle' | 'pageUnavailable' | 'lookupFailed' }>
}

export const AddonUnavailableDialog: FC<AddonUnavailableDialogProps> = ({
  label,
  addon,
  state,
}) => {
  const { data: currentUser } = useGetCurrentUserQuery()
  const isAdmin = !!currentUser?.data?.isAdmin
  const title = label || addon.name

  const { heading, explanation, nextStep } = getAddonUnavailableText(
    state,
    addon.name,
    title,
    isAdmin,
  )

  return (
    <Styled.PowerpackDialog isOpen size="lg" hideCancelButton hideBackdrop onClose={() => {}}>
      <Styled.MainFeature>
        <h1>
          <Icon icon={addon.icon} />
          {title}
        </h1>
        <h2>{heading}</h2>
      </Styled.MainFeature>

      <Styled.FeaturesList>
        <h3>{explanation}</h3>
        <h3>{nextStep}</h3>
      </Styled.FeaturesList>

      {isAdmin && state.status === 'notInBundle' && (
        // production: open a copy of the production bundle with the addon selected
        <Link
          to={
            state.bundleVariant === 'production'
              ? `/settings/bundles?duplicate=prod&addon=${addon.name}`
              : '/settings/bundles'
          }
        >
          <Button variant="filled" icon="settings">
            Open Bundles
          </Button>
        </Link>
      )}
      {state.status === 'lookupFailed' && (
        <Button variant="filled" icon="refresh" onClick={state.retry}>
          Try again
        </Button>
      )}
      {state.status === 'pageUnavailable' && (
        <Button variant="filled" icon="refresh" onClick={() => window.location.reload()}>
          Reload
        </Button>
      )}
    </Styled.PowerpackDialog>
  )
}

export default AddonUnavailableDialog
