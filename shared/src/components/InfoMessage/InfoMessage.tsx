import { forwardRef } from 'react'
import * as Styled from './InfoMessage.styled'
import clsx from 'clsx'
import { Icon, IconProps, Button } from '@ynput/ayon-react-components'

interface InfoMessageAction {
  label: string
  icon: string
  callback: () => void
}

interface InfoMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'error' | 'success'
  message: string
  icon?: IconProps['icon']
  action?: InfoMessageAction
}

export const InfoMessage = forwardRef<HTMLDivElement, InfoMessageProps>(
  ({ variant = 'info', message, icon, action, ...props }, ref) => {
    return (
      <Styled.MessageCard
        className={clsx('message', props.className, variant)}
        {...props}
        ref={ref}
      >
        <div className="content">
          <Icon icon={icon || getVariantIcon(variant)} />
          {message}
        </div>
        {action && (
          <Button
            // @ts-expect-error
            icon={action.icon}
            onClick={(e) => {
              e.stopPropagation()
              action.callback()
            }}
          >
            {action.label}
          </Button>
        )}
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

export default InfoMessage
