import React from 'react'
import Typography from '/src/theme/typography.module.css'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'

export const Placeholder = styled.div`
  position: absolute;
  /* center */
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  user-select: none;

  h3 {
    text-align: center;
  }

  .icon {
    font-size: 64px;
    padding: 8px;
    background-color: var(--md-sys-color-secondary-container);
    border-radius: 100%;
    color: var(--md-sys-color-on-secondary-container);
  }

  &.isError {
    .icon {
      color: var(--md-sys-color-error-container);
      background-color: var(--md-sys-color-on-error-container);
    }

    .error-message {
      max-width: 700px;
      color: var(--md-sys-color-error-on-container);
      background-color: var(--md-sys-color-error-container);

      padding: var(--padding-m) var(--padding-m);
      border-radius: var(--border-radius-m);
      user-select: text;
      margin-top: -16px;
    }
  }
`

const EmptyPlaceholder = ({ icon, message, error }) => {
  if (error) {
    return (
      <Placeholder className={'isError'}>
        <Icon icon="error" />
        <h3 className={Typography.titleLarge}>Something went wrong.</h3>
        <span className="error-message">ERROR: {error}</span>
        <span>This should not happen. Please send a screenshot to the Ynput team!</span>
      </Placeholder>
    )
  }

  return (
    <Placeholder>
      <Icon icon={icon} />
      <h3 className={Typography.titleLarge}>{message}</h3>
    </Placeholder>
  )
}

export default EmptyPlaceholder
