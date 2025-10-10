import { FC } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { UserImage } from '../UserImage'
import clsx from 'clsx'

export const EVERYONE_GROUP_KEY = '__everyone__' as const
export const EVERY_GUESTS_KEY = '__guests__' as const

export const GROUP_KEY_PREFIX = 'group:'
export const TEAM_KEY_PREFIX = 'team:'
export const USER_KEY_PREFIX = 'user:'
export const GUEST_KEY_PREFIX = 'guest:'

interface StyledIconProps {
  $size: number
}

const StyledIcon = styled(Icon)<StyledIconProps>`
  font-size: ${({ $size }) => `${$size}px`};
  &.withBackground {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: var(--md-sys-color-surface-container-high);
    padding: 3px;
  }
`

export interface ShareOptionIconProps {
  shareType?: string
  name: string
  label?: string
  icon?: string // For backwards compatibility (explicit icon override)
  size?: number
  withBackground?: boolean
}

export const ShareOptionIcon: FC<ShareOptionIconProps> = ({
  shareType,
  name,
  label,
  size = 24,
  withBackground = false,
}) => {
  // Fallback: infer shareType from name prefix if not provided
  let effectiveShareType = shareType
  let strippedName = name
  if (!effectiveShareType) {
    if (name.startsWith(USER_KEY_PREFIX)) {
      effectiveShareType = 'user'
      strippedName = name.slice(USER_KEY_PREFIX.length)
    } else if (name.startsWith(GROUP_KEY_PREFIX)) {
      effectiveShareType = 'group'
      strippedName = name.slice(GROUP_KEY_PREFIX.length)
    } else if (name.startsWith(TEAM_KEY_PREFIX)) {
      effectiveShareType = 'team'
      strippedName = name.slice(TEAM_KEY_PREFIX.length)
    } else if (name.startsWith(GUEST_KEY_PREFIX)) {
      effectiveShareType = 'guest'
      strippedName = name.slice(GUEST_KEY_PREFIX.length)
    }
  }

  // helper to render an icon name with centralized props
  const renderIcon = (iconName: string, tooltip?: string) => (
    <StyledIcon
      className={clsx({ withBackground })}
      icon={iconName}
      data-tooltip={tooltip}
      data-tooltip-delay={0}
      $size={withBackground ? size - 6 : size}
    />
  )

  // Use shareType-based logic
  if (effectiveShareType === 'user') {
    return <UserImage name={strippedName} fullName={label} size={size} />
  }

  if (effectiveShareType === 'group') return renderIcon('shield_person', 'Access group')
  if (effectiveShareType === 'team') return renderIcon('groups', 'Team')
  if (effectiveShareType === 'guest' || name === EVERY_GUESTS_KEY)
    return renderIcon('badge', 'Guest user')
  if (name === EVERYONE_GROUP_KEY)
    return renderIcon('groups', 'Everyone with access to the project')

  // Default fallback
  return renderIcon('person')
}
