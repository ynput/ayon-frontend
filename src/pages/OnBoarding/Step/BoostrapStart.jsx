import React, { useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'

import YnputConnector from '../../../components/YnputConnector'
import { SaveButton } from '@ynput/ayon-react-components'

export const BootstrapStart = ({ nextStep, ynputConnect }) => {
  const [showMore, setShowMore] = useState(false)

  const handleSkip = () => {}

  const handleConnection = (c) => {
    // setIsConnectionLoading(false)
    if (c) {
      nextStep()
    }
  }

  return (
    <>
      {showMore && (
        <>
          <Styled.More>
            <h2>{`What is ${ynputConnect ? 'Setup Wizard' : 'Ynput Connect'}?`}</h2>
            <p>
              AYON is a highly modular platform. Connecting your Ynput account to AYON lets us
              automatically download and setup all you need to take full advantage of AYON in your
              production.
            </p>
            <br />
            <p>
              If you are in offline environment or you would rather download and install all the
              addons, desktop distribution and dependencies manually, you can skip this step.
            </p>
            <span className="skip" onClick={handleSkip}>
              I know what I am doing, skip bootstrap.
            </span>
          </Styled.More>
        </>
      )}
      <Styled.Login>
        <h2>Configure your server</h2>
        <Styled.Connect>
          <span>Fast and Automated setup with</span>
          {ynputConnect ? (
            <SaveButton active onClick={nextStep}>
              Setup Wizard
            </SaveButton>
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
        {!showMore && (
          <span className="more" onClick={() => setShowMore(true)}>
            Read more or skip
          </span>
        )}
      </Styled.Login>
    </>
  )
}
