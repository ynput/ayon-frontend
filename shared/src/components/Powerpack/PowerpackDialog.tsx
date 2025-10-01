import * as Styled from './PowerpackDialog.styled'
import { FC, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import { PricingLink } from './PricingLink'
import { powerpackFeatureOrder, powerpackFeatures, usePowerpack } from '@shared/context'
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
  const [showAll, setShowAll] = useState(false)
  const { setPowerpackDialog, selectedPowerPack, powerpackDialog } = usePowerpack()
  const { openSupport, messengerLoaded } = useFeedback()

  if (!powerpackDialog && (!label || !description)) return null

  // Dynamic support message
  const featureLabel = label ?? powerpackDialog?.label ?? (addon ? 'this addon' : 'this feature')
  const SUPPORT_MESSAGE = addon
    ? `I would like to know how I can try out the "${featureLabel}" addon?`
    : `I would like to know how I can try out the "${featureLabel}" power feature?`

  const sortedFeatures = Object.entries(features ?? powerpackFeatures).sort(([keyA], [keyB]) => {
    // Move selected feature to the top
    if (keyA === selectedPowerPack) return -1
    if (keyB === selectedPowerPack) return 1

    const indexA = powerpackFeatureOrder.indexOf(keyA as any)
    const indexB = powerpackFeatureOrder.indexOf(keyB as any)

    if (indexA > -1 && indexB > -1) {
      return indexA - indexB
    }
    if (indexA > -1) return -1
    if (indexB > -1) return 1
    return 0
  })

  const handleClose = () => {
    if (!isCloseable) return
    setPowerpackDialog(null)
    setShowAll(false)
  }

  return (
    <Styled.PowerpackDialog
      isOpen
      onClose={handleClose}
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
          {sortedFeatures.slice(0, showAll ? undefined : 5).map(([key, value]) => (
            <li key={key}>
              <Icon icon={value.icon ?? 'check'} />
              <span>{value.bullet}</span>
            </li>
          ))}
        </ul>
        {!showAll && sortedFeatures.length > 5 && (
          <Styled.ShowAll onClick={() => setShowAll(true)}>Show all</Styled.ShowAll>
        )}
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
