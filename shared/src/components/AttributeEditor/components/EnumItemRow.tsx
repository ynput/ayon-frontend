import { FC } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

import { isEnumIconImage } from '@shared/util/attributeEnum'

export const EnumItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  overflow: hidden;
  height: 20px;
  flex: none;

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }

  .icon-slot {
    flex: none;
    width: 20px;
  }
`

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
