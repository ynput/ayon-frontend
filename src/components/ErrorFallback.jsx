import { Button, Panel } from '@ynput/ayon-react-components'
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
  return (
    <StyledPanel>
      <h1>Something went wrong :(</h1>
      <pre style={{ color: 'var(--color-hl-error)' }}>{error.toString()}</pre>
      <a href="https://github.com/ynput/ayon-frontend/issues" target="_blank" rel="noreferrer">
        <Button
          icon={'bug_report'}
          label={'Please open an Issue'}
          style={{
            width: '100%',
          }}
        />
      </a>
    </StyledPanel>
  )
}

export default ErrorFallback
