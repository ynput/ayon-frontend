import React, { useContext, useEffect, useState } from 'react'
import { OnBoardingContext } from './OnBoardingContext'
import * as Styled from './OnBoardingStep.styled'
import FooterButtons from './FooterButtons'
import LoadingPage from '../../LoadingPage'
import { Button } from '@ynput/ayon-react-components'
import Type from '/src/theme/typography.module.css'

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

  // create header component to be user in all steps
  const Header = ({ children }) => <h2 className={Type.headlineLarge}>{children}</h2>
  const Body = ({ children }) => <p className={Type.bodyMedium}>{children}</p>

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
        Header,
        Body,
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
