import React from 'react'
import * as Styled from '../util/OnBoardingStep.styled'

import YnputConnector from '../../../components/YnputConnector'
import { YnputConnectorButton } from '/src/components/YnputConnectButton'

export const BootstrapStart = ({ nextStep, ynputConnect, setIsConnecting, onFinish }) => {
  const message1 = `Bootstrap Setup lets us automatically download and setup all you need to take full advantage of AYON in your production.`

  return (
    <>
      {/* {showMore && (
        <>
          <Styled.More>
            <h2>{`What is ${ynputConnect ? 'Setup Wizard' : 'Ynput Connect'}?`}</h2>
            <p>
              AYON is a highly modular platform. Connecting your Ynput account to AYON lets us
              automatically download and setup all you need to take full advantage of AYON in your
              production.
            </p>
            <br />

            <span className="skip" onClick={handleSkip}>
              I know what I am doing, skip bootstrap.
            </span>
          </Styled.More>
        </>
      )} */}
      <Styled.Login>
        <h2>Configure your server</h2>
        <p>{message1}</p>
        <p>
          If you are in offline environment or you would rather download and install all the addons,
          desktop distribution and dependencies manually, you can skip this step.
        </p>
        <Styled.Connect>
          <span>Fast and Automated setup with</span>
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

        <span className="more" onClick={onFinish}>
          I know what I am doing, skip bootstrap.
        </span>
      </Styled.Login>
    </>
  )
}
