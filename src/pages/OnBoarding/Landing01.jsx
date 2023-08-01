import React, { useContext, useEffect, useState } from 'react'
import * as Styled from './OnBoarding.styled'
import { OnBoardingContext } from './OnBoardingContext'
import YnputConnect from '/src/components/YnputConnect'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'

const Landing01 = () => {
  const [markdown, setMarkdown] = useState('')

  useEffect(() => {
    fetch('/moreBlurb.md')
      .then((response) => response.text())
      .then((text) => setMarkdown(text))
  }, [])
  // import context

  const { stepIndex } = useContext(OnBoardingContext)
  const [showMore, setShowMore] = useState(false)

  if (stepIndex !== 0) return null

  const handleSkip = () => {}

  const handleConnect = () => {}

  return (
    <Styled.LoginForm style={{ gap: 32 }}>
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
        <div>
          <span>Fast and Automated setup with</span>
          <YnputConnect onClick={handleConnect} />
        </div>
        {!showMore && (
          <span className="more" onClick={() => setShowMore(true)}>
            Read more or skip
          </span>
        )}
      </Styled.Login>
    </Styled.LoginForm>
  )
}

export default Landing01
