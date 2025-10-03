import { FC } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import { UserImage } from '../UserImage'
export const EVERYONE_GROUP_KEY = '__everyone__' as const

export interface ShareOptionIconProps {
  shareType?: string
  name: string
  label?: string
  icon?: string // For backwards compatibility (explicit icon override)
}

export const ShareOptionIcon: FC<ShareOptionIconProps> = ({ shareType, name, label }) => {
  // Use shareType-based logic
  if (shareType === 'user') {
    return <UserImage name={name} fullName={label} size={24} />
  } else if (shareType === 'group') {
    return <Icon icon="shield_person" data-tooltip={'Access group'} data-tooltip-delay={0} />
  } else if (shareType === 'team') {
    return <Icon icon="groups" data-tooltip={'Team'} data-tooltip-delay={0} />
  } else if (name === EVERYONE_GROUP_KEY) {
    return (
      <Icon
        icon="groups"
        data-tooltip={'Everyone with access to the project the view is in'}
        data-tooltip-delay={0}
      />
    )
  }

  // Default fallback to UserImage
  return <Icon icon="person" />
}

export default ShareOptionIcon
