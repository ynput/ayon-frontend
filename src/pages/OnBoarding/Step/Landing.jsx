import React, { useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import YnputConnector from '@components/YnputCloud/YnputConnector'

export const Landing = ({ Header, Body, nextStep, setUserForm, setIsConnecting }) => {
  const [showMore, setShowMore] = useState(false)

  const handleConnection = (user) => {
    if (user) {
      // set user userName and userEmail
      setUserForm((userForm) => ({ ...userForm, name: user.userName, email: user.userEmail }))
      nextStep()
      setIsConnecting(false)
    }
  }

  return (
    <>
      {showMore && (
        <>
          <Styled.More>
            <Header>{`What is Ynput Cloud?`}</Header>
            <Body>
              AYON is a highly modular platform. Connecting your Ynput Cloud account to AYON lets us
              automatically download and setup all you need to take full advantage of AYON in your
              production.
              <br /> <br />
              If you are in an offline environment or you would rather download and install all the
              addons, desktop distribution and dependencies manually, you can skip this step.
            </Body>
            <Styled.Skip className="skip" onClick={(e) => nextStep(e, 1)}>
              I know what I am doing, skip bootstrap.
            </Styled.Skip>
          </Styled.More>
        </>
      )}
      {/* <Styled.Logo src="/AYON.svg" /> */}
      <Styled.Section style={{ width: 300, textAlign: 'center', alignItems: 'center' }}>
        <Header>Lets get things set up for you.</Header>
        <Body>To make things as easy as possible we recommend using Ynput Connect.</Body>
        <Styled.Connect style={{ marginTop: 16 }}>
          <Body>Fast and Automated setup with</Body>
          <YnputConnector
            hideSignOut
            redirect="/onboarding"
            onConnection={handleConnection}
            onClick={() => setIsConnecting(true)}
            showDropdown={false}
            showStatus={false}
          />
        </Styled.Connect>
        {!showMore && (
          <Styled.Skip onClick={() => setShowMore(true)}> Read more or skip </Styled.Skip>
        )}
      </Styled.Section>
    </>
  )
}

export default Landing
