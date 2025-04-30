import React, { useContext, useEffect, useState } from 'react'
import { useGetSiteInfoQuery } from '@shared/api'
import * as Styled from './util/OnBoardingStep.styled'
import OnBoardingProvider from './util/OnBoardingContext'
import * as Step from './Step'
import { Navigate, useLocation } from 'react-router'
import StepWrapper from './util/StepWrapper'
import { useRestartServerMutation } from '@queries/restartServer'
import { SocketContext } from '@context/websocketContext'
import ServerRestartingPage from '@components/ServerRestartingPage'

const OnBoardingPage = ({ noAdminUser, onFinish, isOnboarding }) => {
  const [isFinishing, setIsFinishing] = useState(false)
  const { data: info = {} } = useGetSiteInfoQuery({ full: true })
  const { loginPageBackground = '' } = info
  const location = useLocation()

  const [restartServer] = useRestartServerMutation()

  const handleFinish = async (restart = true) => {
    if (!restart) return setTimeout(() => onFinish(), 1000)
    await restartServer().unwrap()
    setIsFinishing(true)
  }

  const serverIsRestarting = useContext(SocketContext)?.serverRestartingVisible

  // start watching serverIsRestarting for change when ifFinishing is true
  useEffect(() => {
    if (!isFinishing) return

    if (!serverIsRestarting) {
      console.log('reconnect after onboarding restart')
      onFinish()
    }
  }, [isFinishing, serverIsRestarting])

  useEffect(() => {
    if (!isOnboarding && isFinishing) {
      setIsFinishing(false)
    }
  }, [isOnboarding, isFinishing])

  // if location is not /onboarding, redirect to /onboarding
  if (location.pathname !== '/onboarding' && isOnboarding) {
    return <Navigate to="/onboarding" replace={true} />
  }

  return (
    <main className="center">
      {loginPageBackground && <Styled.BG src={loginPageBackground} />}
      <OnBoardingProvider initStep={noAdminUser ? 0 : 3} onFinish={handleFinish}>
        <StepWrapper>
          <Step.Landing step={0} />
          <Step.ConnectionDetails step={1} />
          <Step.CreateUser step={2} />
          <Step.BootstrapStart step={3} />
          <Step.ConnectionDetails step={4} />
          <Step.ReleaseSelect step={5} />
          <Step.AddonSelectStep step={6} />
          <Step.PlatformSelectStep step={7} />
          <Step.ProgressInstall step={8} />
        </StepWrapper>
        {isFinishing && (
          <ServerRestartingPage
            active={isFinishing}
            message={'Almost there! Restarting server to apply setup...'}
          />
        )}
      </OnBoardingProvider>
    </main>
  )
}

export default OnBoardingPage
