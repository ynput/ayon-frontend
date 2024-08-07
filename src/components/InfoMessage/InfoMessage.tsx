import { forwardRef } from 'react'
import * as Styled from './InfoMessage.styled'
import clsx from 'clsx'
import { Icon, IconProps } from '@ynput/ayon-react-components'

interface InfoMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'error' | 'success'
  message: string
}

export const InfoMessage = forwardRef<HTMLDivElement, InfoMessageProps>(
  ({ variant = 'info', message, ...props }, ref) => {
    return (
      <Styled.MessageCard
        className={clsx('message', props.className, variant)}
        {...props}
        ref={ref}
      >
        <Icon icon={getVariantIcon(variant)} />
        {message}
      </Styled.MessageCard>
    )
  },
)

const getVariantIcon = (variant: InfoMessageProps['variant']): IconProps['icon'] => {
  switch (variant) {
    case 'info':
      return 'info'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    case 'success':
      return 'done_all'
    default:
      return 'info'
  }
}
