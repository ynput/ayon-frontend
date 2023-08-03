import React from 'react'
import { useGetInfoQuery } from '/src/services/auth/getAuth'
import * as Styled from './OnBoardingStep.styled'
import OnBoardingProvider from './OnBoardingContext'
import * as Step from './Step'
import { useLocation, useNavigate } from 'react-router'
import StepWrapper from './StepWrapper'
import YnputConnector from '../SettingsPage/YnputConnector'

const OnBoardingPage = () => {
  const { data: info = {} } = useGetInfoQuery()
  const { loginPageBackground = '' } = info
  const navigate = useNavigate()
  const location = useLocation()

  // if location is not /onboarding, redirect to /onboarding
  if (location.pathname !== '/onboarding') {
    navigate('/onboarding')
  }

  return (
    <main className="center">
      {loginPageBackground && <Styled.BG src={loginPageBackground} />}
      <OnBoardingProvider serverInfo={info}>
        <StepWrapper>
          <Step.LandingStep step={0} />
          <Step.PresetStep step={1} />
        </StepWrapper>
      </OnBoardingProvider>

      {/*  eslint-disable-next-line no-undef */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
          }}
        >
          <YnputConnector />
        </div>
      )}
    </main>
  )
}

export default OnBoardingPage
