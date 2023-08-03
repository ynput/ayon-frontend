import React, { useEffect, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import YnputConnector from '../../SettingsPage/YnputConnector'
import { SaveButton } from '@ynput/ayon-react-components'

export const BootstrapStart = ({ nextStep, ynputConnect }) => {
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
            <ReactMarkdown>{markdown}</ReactMarkdown>
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
