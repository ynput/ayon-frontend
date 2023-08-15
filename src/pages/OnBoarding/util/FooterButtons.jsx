import React from 'react'
import * as Styled from './OnBoardingStep.styled'
import { Button } from '@ynput/ayon-react-components'

const FooterButtons = ({
  back = 'Back',
  next = 'Next',
  onNext,
  onBack,
  nextProps,
  backProps,
  showIcon,
  ...props
}) => {
  return (
    <Styled.Footer $showIcon={showIcon} {...props}>
      {back && (
        <Button onClick={onBack} className="back" {...backProps}>
          {back}
        </Button>
      )}
      {next && (
        <Styled.NextButton onClick={onNext} label={next} active className="next" {...nextProps} />
      )}
    </Styled.Footer>
  )
}

export default FooterButtons
