import React, { useEffect, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import YnputConnector from '../../SettingsPage/YnputConnector'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'

export const Landing = ({ nextStep, setUserForm }) => {
  const [markdown, setMarkdown] = useState('')

  useEffect(() => {
    fetch('/moreBlurb.md')
      .then((response) => response.text())
      .then((text) => setMarkdown(text))
  }, [])
  // import context

  const [showMore, setShowMore] = useState(false)

  const handleConnection = (user) => {
    if (user) {
      // set user userName and userEmail
      setUserForm((userForm) => ({ ...userForm, name: user.userName, email: user.userEmail }))
      nextStep()
    }
  }

  return (
    <>
      {showMore && (
        <>
          <Styled.More>
            <h2>{`What is Ynput Connect?`}</h2>
            <ReactMarkdown>{markdown}</ReactMarkdown>
            <Styled.Skip className="skip" onClick={nextStep}>
              I know what I am doing, skip bootstrap.
            </Styled.Skip>
          </Styled.More>
        </>
      )}
      <Styled.Section style={{ width: 300, textAlign: 'center', alignItems: 'center' }}>
        <Styled.Ayon src="/AYON.svg" />
        <h2>Lets get things set up for you.</h2>
        <p>Lets configure your server.</p>
        <p>To make things as easy as possible we recommend using Ynput Connect.</p>
        <Styled.Connect style={{ marginTop: 16 }}>
          <span>Fast and Automated setup with</span>
          <YnputConnector
            showLoading={false}
            hideSignOut
            redirect="/onboarding"
            onConnection={handleConnection}
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
