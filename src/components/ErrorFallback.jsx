import { Button, Panel, Section } from '@ynput/ayon-react-components'
import React from 'react'
import styled from 'styled-components'

const StyledPanel = styled(Panel)`
  max-width: 300px;
  min-width: min-content;
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);

  pre {
    white-space: pre-wrap;
  }
`

const ErrorFallback = ({ error }) => {
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
      <h1>Something went wrong :(</h1>
      <pre style={{ color: 'var(--color-hl-error)' }}>{error?.toString()}</pre>
      <Section direction="row">
        <a href="https://github.com/ynput/ayon-frontend/issues" target="_blank" rel="noreferrer">
          <Button
            icon={'bug_report'}
            label={'Report bug'}
            style={{
              width: '100%',
            }}
            variant="text"
          />
        </a>
        <Button
          label={'Reload page'}
          icon="sync"
          variant="filled"
          onClick={() => window.location.reload()}
        />
      </Section>
    </StyledPanel>
  )
}

export default ErrorFallback
