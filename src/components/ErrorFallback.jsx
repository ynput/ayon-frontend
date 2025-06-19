import { useFeedback } from '@/feedback/FeedbackContext'
import { Button, Panel, Section } from '@ynput/ayon-react-components'
import React from 'react'
import styled from 'styled-components'

const StyledPanel = styled(Panel)`
  max-width: 300px;
  min-width: min-content;
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;

  pre {
    white-space: pre-wrap;
    padding: 8px;
    background-color: var(--md-sys-color-error-container);
    border-radius: 4px;

    color: var(--md-sys-color-on-error-container);
  }

  a,
  button {
    width: 100%;
  }

  button {
    height: 40px;
  }
`

const ErrorFallback = ({ error }) => {
  const { openSupport } = useFeedback()

  if (error?.toString()?.includes('TypeError: Failed to fetch dynamically imported module:')) {
    return (
      <StyledPanel>
        <h1>AYON has been updated. Please reload for changes.</h1>
        <Button
          label={'Reload page'}
          icon="sync"
          variant="filled"
          onClick={() => window.location.reload(true)}
        />
        <span>1. If that does not work: try shift + ctrl/cmd + R</span>
        <span>
          2. If reloading does not work: try shift + ctrl/cmd + delete. Then clear Cached images and
          files.
        </span>
      </StyledPanel>
    )
  }

  return (
    <StyledPanel>
      <h1>Something went wrong, please send a report to Ynput.</h1>
      <pre>{error?.toString()}</pre>
      <Section direction="row">
        <Button
          label={'Send report'}
          icon="report"
          onClick={() =>
            openSupport('NewMessage', `I have encountered an error: ${error?.toString()}`)
          }
        />
        <a href="/">
          <Button label={'Home'} icon="home" variant="filled" />
        </a>
      </Section>
    </StyledPanel>
  )
}

export default ErrorFallback
