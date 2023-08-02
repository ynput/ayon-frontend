import React, { useContext, useState } from 'react'
import { OnBoardingContext } from '../OnBoardingContext'
import * as Styled from './OnBoardingStep.styled'

// this wraps all steps, provides context and makes sure they are rendered in order
const StepWrapper = ({ children }) => {
  const [isConnectionLoading, setIsConnectionLoading] = useState(true)
  // for children get the step prop
  // get the stepIndex from context
  const { stepIndex, ...props } = useContext(OnBoardingContext)
  // if stepIndex === step, render children

  // filter out children where the step prop doesn't match the stepIndex
  const filteredChildren = React.Children.map(children, (child) => {
    if (child.props.step === stepIndex) {
      // spread the props object into the child component
      return React.cloneElement(child, { ...props, setIsConnectionLoading })
    }
  })

  return (
    <Styled.StepPanel
      style={{
        opacity: isConnectionLoading && stepIndex === 0 ? 0 : 1,
      }}
    >
      {filteredChildren}
    </Styled.StepPanel>
  )
}

export default StepWrapper
