import React from 'react'
import * as Styled from './OnBoardingStep.styled'
import { Button, SaveButton } from '@ynput/ayon-react-components'

const FooterButtons = ({ back = 'Back', next = 'Next', onNext, onBack, nextProps, backProps }) => {
  return (
    <Styled.Footer>
      {back && (
        <Button onClick={onBack} className="back" {...backProps}>
          {back}
        </Button>
      )}
      {next && (
        <SaveButton onClick={onNext} active className="next" {...nextProps}>
          {next}
        </SaveButton>
      )}
    </Styled.Footer>
  )
}

export default FooterButtons
