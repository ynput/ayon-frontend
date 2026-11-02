import React, { FC } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { getRequestErrorString } from '@shared/util'
import { Placeholder } from './EmptyPlaceholder.styled'

export interface EmptyPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: string
  message?: string
  error?: any
  ynputError?: boolean
  pt?: {
    error?: React.HTMLAttributes<HTMLDivElement>
  }
}

export const EmptyPlaceholder: FC<EmptyPlaceholderProps> = ({
  icon,
  message,
  error,
  ynputError = true,
  children,
  pt,
  className,
  ...props
}) => {
  if (error) {
    return (
      <Placeholder className={clsx(className, 'empty-placeholder', 'isError')} {...props}>
        <Icon icon="error" className="placeholder-icon" />
        <h3>Something went wrong.</h3>
        <span className="error-message" {...pt?.error}>
          ERROR: {getRequestErrorString(error) || 'Unknown error'}
        </span>
        {ynputError && (
          <span>This should not happen. Please send a screenshot to the Ynput team!</span>
        )}
        {children}
      </Placeholder>
    )
  }

  return (
    <Placeholder className={clsx(className, 'empty-placeholder')} {...props}>
      <Icon icon={icon || 'info'} className="placeholder-icon" />
      <h3>{typeof message === 'object' ? JSON.stringify(message) : message}</h3>
      {children}
    </Placeholder>
  )
}
