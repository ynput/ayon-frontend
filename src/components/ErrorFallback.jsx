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
  if (error?.toString()?.includes('TypeError: Failed to fetch dynamically imported module:'))
    window.location.reload()

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
