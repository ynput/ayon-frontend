import getSubscribeLink from '@components/TrialBanner/helpers/getSubscribeLink'
import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import * as Styled from './TrialEnded.styled'

interface TrialEndedProps {
  instanceId: string
}

const TrialEnded: FC<TrialEndedProps> = ({ instanceId }) => {
  return (
    <Styled.TrialEndContainer>
      <Styled.TrialEndCard>
        <h1>Your free trial has ended!</h1>
        <p>
          AYON simplifies your VFX pipeline and boosts efficiency. Need help? Our support team is
          here for you if required.
        </p>
        <p>Subscribe to keep using AYON and protect your data!</p>
        <a href={getSubscribeLink(instanceId)} target="_blank" rel="noreferrer">
          <Button variant="tertiary">Subscribe now</Button>
        </a>
      </Styled.TrialEndCard>
    </Styled.TrialEndContainer>
  )
}

export default TrialEnded
