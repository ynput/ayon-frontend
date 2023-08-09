import React from 'react'
import { useGetInfoQuery } from '/src/services/auth/getAuth'
import * as Styled from './util/OnBoardingStep.styled'
import OnBoardingProvider from './util/OnBoardingContext'
import * as Step from './Step'
import { Navigate, useLocation } from 'react-router'
import StepWrapper from './util/StepWrapper'
// import YnputConnector from '../../components/YnputConnector'

const OnBoardingPage = ({ noAdminUser }) => {
  const { data: info = {} } = useGetInfoQuery()
  const { loginPageBackground = '' } = info
  const location = useLocation()

  // if location is not /onboarding, redirect to /onboarding
  if (location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace={true} />
  }

  return (
    <main className="center">
      {loginPageBackground && <Styled.BG src={loginPageBackground} />}
      <OnBoardingProvider initStep={noAdminUser ? 0 : 2}>
        <StepWrapper>
          <Step.Landing step={0} />
          <Step.CreateUser step={1} />
          <Step.BootstrapStart step={2} />
          <Step.ReleaseSelect step={3} />
          <Step.AddonSelectStep step={4} />
          <Step.ProgressInstall step={5} />
        </StepWrapper>
      </OnBoardingProvider>

      {/*  eslint-disable-next-line no-undef */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
          }}
        >
          <YnputConnector />
        </div>
      )} */}
    </main>
  )
}

export default OnBoardingPage
