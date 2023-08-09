import React from 'react'
import * as Styled from './OnBoardingStep.styled'
import { Button, SaveButton } from '@ynput/ayon-react-components'

const FooterButtons = ({
  back = 'Back',
  next = 'Next',
  onNext,
  onBack,
  nextProps,
  backProps,
  showIcon,
}) => {
  return (
    <Styled.Footer $showIcon={showIcon}>
      {back && (
        <Button onClick={onBack} className="back" {...backProps}>
          {back}
        </Button>
      )}
      {next && (
        <SaveButton
          onClick={onNext}
          label={next}
          active
          className="next"
          {...nextProps}
        ></SaveButton>
      )}
    </Styled.Footer>
  )
}

export default FooterButtons
