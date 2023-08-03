import React from 'react'
import * as Styled from './OnBoardingStep.styled'
import { Button, SaveButton } from '@ynput/ayon-react-components'

const FooterButtons = ({ back = 'Back', next = 'Next', onNext, onBack }) => {
  return (
    <Styled.Footer>
      {back && (
        <Button onClick={onBack} className="back">
          {back}
        </Button>
      )}
      {next && (
        <SaveButton onClick={onNext} active className="next">
          {next}
        </SaveButton>
      )}
    </Styled.Footer>
  )
}

export default FooterButtons
