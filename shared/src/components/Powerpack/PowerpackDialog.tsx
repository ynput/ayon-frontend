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
  const { setPowerpackDialog, selectedPowerPack, powerpackDialog, addonDialog } = usePowerpack()
  const { openSupport, messengerLoaded } = useFeedback()

  // Determine if we're showing an addon dialog (from context or props)
  const isAddon = !!addon || !!addonDialog

  // Resolve the active dialog values: props override context, addon context provides its own data
  const activeLabel = label ?? powerpackDialog?.label ?? addonDialog?.label
  const activeDescription =
    description ??
    powerpackDialog?.description ??
    (addonDialog
      ? addonDialog.features[addonDialog.selectedFeature ?? '']?.description ??
        Object.values(addonDialog.features)[0]?.description
      : undefined)
  const activeIcon = addon?.icon ?? (addonDialog ? addonDialog.icon : 'bolt')

  if (!powerpackDialog && !addonDialog && (!label || !description)) return null

  // Dynamic support message
  const featureLabel = activeLabel ?? (isAddon ? 'this addon' : 'this feature')
  const SUPPORT_MESSAGE = isAddon
    ? `I would like to know how I can try out the "${featureLabel}" addon?`
    : `I would like to know how I can try out the "${featureLabel}" power feature?`

  // Resolve the features list and sort it
  const resolveFeatures = (): [string, Pick<PowerpackDialogType, 'bullet' | 'icon'>][] => {
    // Explicit features prop takes highest priority
    if (features) {
      return Object.entries(features)
    }

    // Addon dialog from context
    if (addonDialog) {
      const ordered = addonDialog.featureOrder
        .filter((key) => key in addonDialog.features)
        .map(
          (key) =>
            [key, addonDialog.features[key]] as [
              string,
              Pick<PowerpackDialogType, 'bullet' | 'icon'>,
            ],
        )

      // Move selected feature to top
      if (addonDialog.selectedFeature) {
        const idx = ordered.findIndex(([key]) => key === addonDialog.selectedFeature)
        if (idx > 0) {
          const [item] = ordered.splice(idx, 1)
          ordered.unshift(item)
        }
      }

      return ordered
    }

    // Default: powerpack features
    return Object.entries(powerpackFeatures).sort(([keyA], [keyB]) => {
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
  }

  const sortedFeatures = resolveFeatures()

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
          <Icon icon={activeIcon} />
          {activeLabel}
        </h1>
        <h2>{activeDescription}</h2>
      </Styled.MainFeature>

      <Styled.FeaturesList>
        {isAddon ? (
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
