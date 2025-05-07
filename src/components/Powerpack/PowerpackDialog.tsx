import { powerpackFeatures, usePowerpack } from '@context/PowerpackContext'
import * as Styled from './PowerpackDialog.styled'
import { FC } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import { PricingLink } from '@components/PricingLink'

interface PowerpackDialogProps {}

const PowerpackDialog: FC<PowerpackDialogProps> = ({}) => {
  const { setPowerpackDialog, selectedPowerPack, powerpackDialog } = usePowerpack()

  if (!powerpackDialog) return null

  return (
    <Styled.PowerpackDialog isOpen onClose={() => setPowerpackDialog(null)} size="lg">
      <Styled.MainFeature>
        <h1>
          <Icon icon="bolt" />
          {powerpackDialog.label}
        </h1>
        <h2>{powerpackDialog.description}</h2>
      </Styled.MainFeature>

      <Styled.FeaturesList>
        <h3>
          Unlock all <Icon icon="bolt" /> <span className="green">Power Features</span> with an AYON
          subscription.
        </h3>
        <ul>
          {Object.entries(powerpackFeatures)
            .sort(([key]) => (key !== selectedPowerPack ? 1 : -1))
            .map(([key, value]) => (
              <li key={key}>
                <Icon icon="check" />
                <span>{value.bullet}</span>
              </li>
            ))}
          <li className="more">More coming soon!</li>
        </ul>
      </Styled.FeaturesList>
      <PricingLink>
        <Styled.MoreButton>Find out more</Styled.MoreButton>
      </PricingLink>
    </Styled.PowerpackDialog>
  )
}

export default PowerpackDialog
