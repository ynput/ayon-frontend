import React, { useContext, useEffect, useState } from 'react'
import { OnBoardingContext } from './OnBoardingContext'
import * as Styled from './OnBoardingStep.styled'
import FooterButtons from './FooterButtons'
import LoadingPage from '../../LoadingPage'
import { Button } from '@ynput/ayon-react-components'

// this wraps all steps, provides context and makes sure they are rendered in order
const StepWrapper = ({ children }) => {
  // for children get the step prop
  // get the stepIndex from context
  const {
    stepIndex,
    previousStep,
    nextStep,
    isLoadingConnect,
    setIsConnecting,
    isConnecting,
    ...props
  } = useContext(OnBoardingContext) || {}
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
        isLoadingConnect,
        setIsConnecting,
        isConnecting,
      })
    }
  })

  const [showCancel, setShowCancel] = useState(false)

  const showLoading = isLoadingConnect || isConnecting

  // after 30 seconds show cancel button
  useEffect(() => {
    setShowCancel(false)
    const timeout = setTimeout(() => {
      setShowCancel(true)
    }, 30000)
    return () => clearTimeout(timeout)
  }, [showLoading])

  return (
    <>
      <Styled.StepPanel>{filteredChildren}</Styled.StepPanel>
      {showLoading && (
        <LoadingPage message={isConnecting && 'Connecting Ynput Account...'}>
          {showCancel && <Button onClick={() => setIsConnecting(false)}>Cancel</Button>}
        </LoadingPage>
      )}
    </>
  )
}

export default StepWrapper
