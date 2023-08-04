import React, { useContext } from 'react'
import { OnBoardingContext } from './OnBoardingContext'
import * as Styled from './OnBoardingStep.styled'
import FooterButtons from './FooterButtons'

// this wraps all steps, provides context and makes sure they are rendered in order
const StepWrapper = ({ children }) => {
  // for children get the step prop
  // get the stepIndex from context
  const { stepIndex, previousStep, nextStep, ...props } = useContext(OnBoardingContext) || {}
  // if stepIndex === step, render children

  // const footer = <Footer onBack={previousStep} onNext={nextStep} />
  // filter out children where the step prop doesn't match the stepIndex
  const filteredChildren = React.Children.map(children, (child) => {
    if (child.props.step === stepIndex) {
      const Footer = ({ ...props }) =>
        FooterButtons({ onBack: previousStep, onNext: nextStep, ...props })
      // spread the props object into the child component
      return React.cloneElement(child, {
        ...props,
        Footer,
        previousStep,
        nextStep,
      })
    }
  })

  return <Styled.StepPanel>{filteredChildren}</Styled.StepPanel>
}

export default StepWrapper
