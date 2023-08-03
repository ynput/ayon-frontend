import React, { useEffect, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import YnputConnector from '../../SettingsPage/YnputConnector'

export const LandingStep = ({ nextStep, setIsConnectionLoading }) => {
  const [markdown, setMarkdown] = useState('')

  useEffect(() => {
    fetch('/moreBlurb.md')
      .then((response) => response.text())
      .then((text) => setMarkdown(text))
  }, [])
  // import context

  const [showMore, setShowMore] = useState(false)

  const handleSkip = () => {}

  const handleConnection = (c) => {
    setIsConnectionLoading(false)
    if (c) {
      nextStep()
    }
  }

  return (
    <>
      {showMore && (
        <>
          <Styled.More>
            <h2>What is Setup with Ynput Connect?</h2>
            <ReactMarkdown>{markdown}</ReactMarkdown>
            <span className="skip" onClick={handleSkip}>
              I know what I am doing, skip bootstrap.
            </span>
          </Styled.More>
        </>
      )}
      <Styled.Login>
        <Styled.Ayon src="/AYON.svg" />
        <h2>Welcome! Lets get things set up for you.</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span>Fast and Automated setup with</span>
          <YnputConnector
            showLoading={false}
            onConnection={handleConnection}
            hideSignOut
            redirect="/onboarding"
            onRedirect={(q) => q && handleConnection(true)}
          />
        </div>
        {!showMore && (
          <span className="more" onClick={() => setShowMore(true)}>
            Read more or skip
          </span>
        )}
      </Styled.Login>
    </>
  )
}
