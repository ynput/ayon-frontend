import React from 'react'
import * as Styled from '../util/OnBoardingStep.styled'

import YnputConnector from '../../../components/YnputConnector'
import { YnputConnectorButton } from '/src/components/YnputConnectButton'

export const BootstrapStart = ({ nextStep, ynputConnect, isLoadingConnect }) => {
  const handleSkip = () => {}

  const handleConnection = (c) => {
    // setIsConnectionLoading(false)
    if (c) {
      nextStep()
    }
  }

  const message1 = `Using ${
    ynputConnect ? 'the Setup Wizard' : 'Ynput Connect'
  } lets us automatically download and setup all you need to take full advantage of AYON in your production.`

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
          {ynputConnect || isLoadingConnect ? (
            <YnputConnectorButton active onClick={nextStep}>
              {!isLoadingConnect && 'Setup Wizard'}
            </YnputConnectorButton>
          ) : (
            <YnputConnector
              showLoading={false}
              onConnection={handleConnection}
              hideSignOut
              redirect="/onboarding"
              onRedirect={(q) => q && handleConnection(true)}
            />
          )}
        </Styled.Connect>

        <span className="more" onClick={handleSkip}>
          I know what I am doing, skip bootstrap.
        </span>
      </Styled.Login>
    </>
  )
}
