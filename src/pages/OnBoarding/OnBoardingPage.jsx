import React from 'react'
import { useGetInfoQuery } from '/src/services/auth/getAuth'
import * as Styled from './OnBoarding.styled'
import OnBoardingProvider from './OnBoardingContext'
import Landing01 from './Landing01'

const OnBoardingPage = () => {
  const { data: info = {} } = useGetInfoQuery()
  const { loginPageBackground = '' } = info

  return (
    <main className="center">
      {loginPageBackground && <Styled.BG src={loginPageBackground} />}
      <OnBoardingProvider serverInfo={info}>
        <Landing01 />
      </OnBoardingProvider>
    </main>
  )
}

export default OnBoardingPage
