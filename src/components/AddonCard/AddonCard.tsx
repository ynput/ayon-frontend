import React, { HTMLAttributes } from 'react'
import * as Styled from './AddonCard.styled'
import { Icon } from '@ynput/ayon-react-components'
import Type from '@/theme/typography.module.css'
import clsx from 'clsx'

interface AddonCardProps extends HTMLAttributes<HTMLButtonElement> {
  name?: string
  icon?: string
  isSelected?: boolean
  error?: string
  version?: string
  title?: string
}

const AddonCard = React.forwardRef<HTMLButtonElement, AddonCardProps>(
  (
    { name, icon = 'check_circle', isSelected, error, version, title, className, ...props },
    ref,
  ) => {
    return (
      <Styled.AddonCard
        ref={ref}
        className={clsx(className, { selected: isSelected, error: !!error })}
        {...props}
      >
        <Icon icon={icon} />
        <span className={Type.titleSmall}>{title || name || 'addon'}</span>
        {error && <span className="error">{error}</span>}
        {version && <span className="version">{version}</span>}
      </Styled.AddonCard>
    )
  },
)

AddonCard.displayName = 'AddonCard'

export default AddonCard
