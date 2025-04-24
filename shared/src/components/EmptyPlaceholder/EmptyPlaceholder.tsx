import React, { FC } from 'react'
import { Icon, theme } from '@ynput/ayon-react-components'
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
    ${theme.titleLarge}
  }

  .placeholder-icon {
    font-size: 64px;
    padding: 8px;
    background-color: var(--md-sys-color-secondary-container);
    border-radius: 100%;
    color: var(--md-sys-color-on-secondary-container);
  }

  &.isError {
    .placeholder-icon {
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

export interface EmptyPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: string
  message?: string
  error?: any
  pt?: {
    error?: React.HTMLAttributes<HTMLDivElement>
  }
}

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  icon,
  message,
  error,
  children,
  pt,
  ...props
}) => {
  if (error) {
    return (
      <Placeholder className={'isError'} {...props}>
        <Icon icon="error" className="placeholder-icon" />
        <h3>Something went wrong.</h3>
        <span className="error-message" {...pt?.error}>
          ERROR: {JSON.stringify(error)}
        </span>
        <span>This should not happen. Please send a screenshot to the Ynput team!</span>
        {children}
      </Placeholder>
    )
  }

  return (
    <Placeholder {...props}>
      <Icon icon={icon || 'info'} className="placeholder-icon" />
      <h3>{typeof message === 'object' ? JSON.stringify(message) : message}</h3>
      {children}
    </Placeholder>
  )
}
