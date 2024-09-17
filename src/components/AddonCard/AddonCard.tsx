import React from 'react'
import * as Styled from './AddonCard.styled'
import { Icon } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'

export interface AddonCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  name?: string
  icon?: string
  isSelected?: boolean
  disabled?: boolean
  error?: string
  endContent?: string | React.ReactNode
  title?: string
  tooltip?: string
}

const AddonCard = React.forwardRef<HTMLButtonElement, AddonCardProps>(
  (
    {
      name,
      icon = 'check_circle',
      isSelected,
      disabled,
      error,
      endContent,
      title,
      tooltip,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Styled.AddonCard
        ref={ref}
        className={clsx(className, { selected: isSelected, error: !!error })}
        disabled={disabled}
        {...props}
      >
        <Icon icon={icon} />
        <span className={Type.titleSmall}>{title || name || 'addon'}</span>
        {tooltip && <Icon icon="info" className="info" data-tooltip={tooltip} />}
        {error && <span className="error">{error}</span>}
        {endContent && <span className="endContent">{endContent}</span>}
      </Styled.AddonCard>
    )
  },
)

AddonCard.displayName = 'AddonCard'

export default AddonCard
