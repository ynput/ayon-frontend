import React, { useContext, useEffect } from 'react'
import { OnBoardingContext } from './OnBoardingContext'
import * as Styled from './OnBoardingStep.styled'
import FooterButtons from './FooterButtons'
import LoadingPage from '../../LoadingPage'
import Type from '@/theme/typography.module.css'
import { toast } from 'react-toastify'

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
  const Header = ({ children, ...props }) => (
    <h2 className={Type.headlineLarge} {...props}>
      {children}
    </h2>
  )
  const Body = ({ children, ...props }) => (
    <p className={Type.bodyMedium} {...props}>
      {children}
    </p>
  )

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
    } else return null
  }).filter((child) => child !== null)

  const showLoading = isLoadingConnect || isConnecting

  // after 10 seconds timeout
  useEffect(() => {
    if (!isConnecting) return
    const timeout = setTimeout(() => {
      toast.error('Connection timed out')
      setIsConnecting(false)
    }, 10000)
    return () => clearTimeout(timeout)
  }, [showLoading, isConnecting])

  return (
    <>
      <Styled.StepPanel>{filteredChildren}</Styled.StepPanel>
      {showLoading && (
        <LoadingPage message={isConnecting && 'Connecting Ynput Account...'}></LoadingPage>
      )}
    </>
  )
}

export default StepWrapper
