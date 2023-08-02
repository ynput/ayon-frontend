import React from 'react'
import * as Styled from './OnBoardingStep.styled'
import { Button } from '@ynput/ayon-react-components'

const FooterButtons = ({ back = 'Back', next = 'Next', onNext, onBack }) => {
  return (
    <Styled.Footer>
      {back && <Button onClick={onBack}>{back}</Button>}
      {next && <Button onClick={onNext}>{next}</Button>}
    </Styled.Footer>
  )
}

export default FooterButtons
