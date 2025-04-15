import React from 'react'
import * as Styled from '../util/OnBoardingStep.styled'

import YnputConnector from '@components/YnputCloud/YnputConnector'
import * as YnputConnect from '@components/YnputCloud/YnputCloud.styled'

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
          If you are in an offline environment or you would rather download and install all the
          addons, desktop distribution and dependencies manually, you can skip this step.
        </Body>
        <Styled.Connect>
          <Body>Fast, automated and 100% free setup with</Body>
          {ynputConnect ? (
            <YnputConnect.HeaderButton
              active
              onClick={() => nextStep(undefined, 1)}
              icon="verified_user"
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              Bootstrap Setup
            </YnputConnect.HeaderButton>
          ) : (
            <YnputConnector
              hideSignOut
              redirect="/onboarding"
              onClick={() => setIsConnecting(true)}
              showDropdown={false}
              showStatus={false}
            />
          )}
        </Styled.Connect>

        <span className="more" onClick={() => onFinish(false, true)}>
          I know what I am doing, skip bootstrap.
        </span>
      </Styled.Login>
    </>
  )
}
