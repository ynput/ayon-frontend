import * as Styled from './PowerpackDialog.styled'
import { FC } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import { PricingLink } from './PricingLink'
import { powerpackFeatures, usePowerpack } from '@shared/context'
import type { PowerpackDialogType } from '@shared/context/PowerpackContext'
import { useFeedback } from '@shared/components'
import { CTAButton } from './CTAButton'

export interface PowerpackDialogProps {
  label?: string
  description?: string
  features?: Record<string, Pick<PowerpackDialogType, 'bullet' | 'icon'>>
  isCloseable?: boolean
  addon?: {
    icon: string
  }
}

export const PowerpackDialog: FC<PowerpackDialogProps> = ({
  label,
  description,
  features,
  isCloseable = true,
  addon,
}) => {
  const { setPowerpackDialog, selectedPowerPack, powerpackDialog } = usePowerpack()
  const { openSupport, messengerLoaded } = useFeedback()

  if (!powerpackDialog && (!label || !description)) return null

  // Dynamic support message
  const featureLabel =
    label ?? powerpackDialog?.label ?? (addon ? 'this addon' : 'this feature')
  const SUPPORT_MESSAGE = addon
    ? `I would like to know how I can try out the "${featureLabel}" addon?`
    : `I would like to know how I can try out the "${featureLabel}" power feature?`

  return (
    <Styled.PowerpackDialog
      isOpen
      onClose={() => (isCloseable ? setPowerpackDialog(null) : undefined)}
      size="lg"
      hideCancelButton={!isCloseable}
      hideBackdrop={!isCloseable}
    >
      <Styled.MainFeature>
        <h1>
          <Icon icon={addon?.icon ? addon.icon : 'bolt'} />
          {label ?? powerpackDialog?.label}
        </h1>
        <h2>{description ?? powerpackDialog?.description}</h2>
      </Styled.MainFeature>

      <Styled.FeaturesList>
        {addon ? (
          <h3>
            Unlock all <span className="green">Premium Addons</span> with an AYON Studio
            subscription.
          </h3>
        ) : (
          <h3>
            Unlock all <Icon icon="bolt" /> <span className="green">Power Features</span> with an
            AYON subscription.
          </h3>
        )}
        <ul>
          {Object.entries(features ?? powerpackFeatures)
            .sort(([key]) => (key !== selectedPowerPack ? 1 : -1))
            .map(([key, value]) => (
              <li key={key}>
                <Icon icon={value.icon ?? 'check'} />
                <span>{value.bullet}</span>
              </li>
            ))}
        </ul>
      </Styled.FeaturesList>
      {messengerLoaded ? (
        <CTAButton onClick={() => openSupport('NewMessage', SUPPORT_MESSAGE)} />
      ) : (
        <PricingLink>
          <CTAButton />
        </PricingLink>
      )}
    </Styled.PowerpackDialog>
  )
}
