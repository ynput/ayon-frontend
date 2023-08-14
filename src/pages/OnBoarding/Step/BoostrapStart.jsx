import React from 'react'
import * as Styled from '../util/OnBoardingStep.styled'

import YnputConnector from '../../../components/YnputConnector'
import { YnputConnectorButton } from '/src/components/YnputConnectButton'

export const BootstrapStart = ({
  nextStep,
  ynputConnect,
  setIsConnecting,
  onFinish,
  Header,
  Body,
}) => {
  const message1 = `Bootstrap Setup lets us automatically download and setup all you need to take full advantage of AYON in your production.`

  return (
    <>
      <Styled.Login>
        <Header>Configure your server</Header>
        <Body>{message1}</Body>
        <Body>
          If you are in offline environment or you would rather download and install all the addons,
          desktop distribution and dependencies manually, you can skip this step.
        </Body>
        <Styled.Connect>
          <Body>Fast and Automated setup with</Body>
          {ynputConnect ? (
            <YnputConnectorButton active onClick={nextStep} icon="verified_user">
              Bootstrap Setup
            </YnputConnectorButton>
          ) : (
            <YnputConnector
              showLoading={false}
              hideSignOut
              redirect="/onboarding"
              onClick={() => setIsConnecting(true)}
            />
          )}
        </Styled.Connect>

        <span className="more" onClick={() => onFinish(false)}>
          I know what I am doing, skip bootstrap.
        </span>
      </Styled.Login>
    </>
  )
}
