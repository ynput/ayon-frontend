import { FC } from 'react'
import { Icon, getReadableColor, type UserColor } from '@ynput/ayon-react-components'

import { isEnumIconImage } from '@shared/util/attributeEnum'

interface EnumItemIconProps {
  icon?: string
  // the enum item, so its light colour is used too
  color?: UserColor
  reserveSpace?: boolean
}

export const EnumItemIcon: FC<EnumItemIconProps> = ({ icon, color, reserveSpace }) => {
  if (isEnumIconImage(icon)) return <img src={icon} alt="" />
  if (icon) return <Icon icon={icon} style={{ color: getReadableColor(color) }} />
  return reserveSpace ? <span className="icon-slot" /> : null
}
