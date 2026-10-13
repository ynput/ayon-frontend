import { FC } from 'react'
import { Icon } from '@ynput/ayon-react-components'

import { isEnumIconImage } from '@shared/util/attributeEnum'

interface EnumItemIconProps {
  icon?: string
  color?: string
  reserveSpace?: boolean
}

export const EnumItemIcon: FC<EnumItemIconProps> = ({ icon, color, reserveSpace }) => {
  if (isEnumIconImage(icon)) return <img src={icon} alt="" />
  if (icon) return <Icon icon={icon} style={{ color }} />
  return reserveSpace ? <span className="icon-slot" /> : null
}
