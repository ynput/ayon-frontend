// Shown on an addon's splash screen when the addon is installed on the server but its page
// isn't available: it is missing from the bundle in use, or its page did not load.
// Unlike the PowerpackDialog this says nothing about subscriptions: the studio may well have one.

import { FC } from 'react'
import { Link } from 'react-router-dom'
import { Button, Icon } from '@ynput/ayon-react-components'
import * as Styled from '@shared/components/Powerpack/PowerpackDialog.styled'
import { useGetCurrentUserQuery } from '@shared/api'
import type { AddonSplashState } from './SplashWrapperPageHelpers'

interface AddonUnavailableDialogProps {
  label?: string
  addon: { name: string; icon: string }
  state: Extract<AddonSplashState, { status: 'notInBundle' | 'pageUnavailable' }>
}

export const AddonUnavailableDialog: FC<AddonUnavailableDialogProps> = ({
  label,
  addon,
  state,
}) => {
  const { data: currentUser } = useGetCurrentUserQuery()
  const isAdmin = !!currentUser?.data?.isAdmin
  const title = label || addon.name
  const bundle = `${state.bundleVariant} bundle`

  const heading =
    state.status === 'notInBundle'
      ? `The ${addon.name} addon is not active in the ${bundle}`
      : `The ${addon.name} addon did not load`

  const explanation =
    state.status === 'notInBundle'
      ? `The ${addon.name} addon is installed on this server, but the ${bundle} does not include it, so ${title} is not available.`
      : `The ${bundle} includes ${addon.name} ${state.version}, but ${title} could not be loaded. The addon version may be too old for this AYON version, or its frontend failed to load.`

  const nextStep =
    state.status === 'notInBundle'
      ? isAdmin
        ? `Add ${addon.name} to the ${bundle} in Bundles settings, then reload the page.`
        : `Ask your AYON administrator to add ${addon.name} to the ${bundle}.`
      : isAdmin
      ? `Reload the page. If ${title} still does not load, check the ${addon.name} version in the bundle or contact support.`
      : `Reload the page. If ${title} still does not load, contact your AYON administrator.`

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
      {state.status === 'pageUnavailable' && (
        <Button variant="filled" icon="refresh" onClick={() => window.location.reload()}>
          Reload
        </Button>
      )}
    </Styled.PowerpackDialog>
  )
}

export default AddonUnavailableDialog
