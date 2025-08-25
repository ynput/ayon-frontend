import { FeedbackProvider, useFeedback } from '@shared/components'
import { useAppSelector } from '@state/store'
import { Button, Panel, Section } from '@ynput/ayon-react-components'
import React from 'react'
import styled from 'styled-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'

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
  if (error?.toString()?.includes('TypeError: Failed to fetch dynamically imported module:')) {
    return (
      <>
        <DocumentTitle title="Oops • AYON" />
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
      </>
    )
  }

  return (
    <>
      <DocumentTitle title="Oops • AYON" />
      <StyledPanel>
      <h1>Something went wrong, please send a report to Ynput.</h1>
      <pre>{error?.toString()}</pre>
      <Section direction="row">
        <FeedbackProvider>
          <SupportButton error={error} />
        </FeedbackProvider>
        <a href="/">
          <Button label={'Home'} icon="home" variant="filled" />
        </a>
      </Section>
      </StyledPanel>
    </>
  )
}

const SupportButton = ({ error }) => {
  const { openSupport } = useFeedback()
  const user = useAppSelector((state) => state.user)
  const errorMessage = `I have encountered an error: ${error?.toString()}
Chrome version: ${navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0] || 'Unknown'}
Page: ${window.location.href}
User: ${user?.name || 'Unknown'} - ${
    user?.data?.isAdmin ? 'Admin' : user?.data?.isManager ? 'Manager' : 'User'
  } 
`

  return (
    <Button
      label={'Send report'}
      icon="report"
      onClick={() => openSupport('NewMessage', errorMessage)}
    />
  )
}

export default ErrorFallback
