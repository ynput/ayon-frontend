import React, { useContext, useEffect, useState } from 'react'
import { useGetInfoQuery } from '/src/services/auth/getAuth'
import * as Styled from './util/OnBoardingStep.styled'
import OnBoardingProvider from './util/OnBoardingContext'
import * as Step from './Step'
import { Navigate, useLocation } from 'react-router'
import StepWrapper from './util/StepWrapper'
import { useRestartServerMutation } from '/src/services/restartServer'
import { SocketContext } from '/src/context/websocketContext'
import ServerRestartBanner from '/src/components/ServerRestartBanner'

const OnBoardingPage = ({ noAdminUser, onFinish, isOnboarding }) => {
  const [isFinishing, setIsFinishing] = useState(false)
  const { data: info = {} } = useGetInfoQuery()
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
      <OnBoardingProvider initStep={noAdminUser ? 0 : 2} onFinish={handleFinish}>
        <StepWrapper>
          <Step.Landing step={0} />
          <Step.CreateUser step={1} />
          <Step.BootstrapStart step={2} />
          <Step.ReleaseSelect step={3} />
          <Step.AddonSelectStep step={4} />
          <Step.ProgressInstall step={5} />
        </StepWrapper>
        {isFinishing && <ServerRestartBanner active={isFinishing} />}
      </OnBoardingProvider>
    </main>
  )
}

export default OnBoardingPage
