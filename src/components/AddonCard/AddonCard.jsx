import React from 'react'
import * as Styled from './AddonCard.styled'
import { Icon } from '@ynput/ayon-react-components'

const AddonCard = ({ name, icon = 'check_circle', isSelected, ...props }) => {
  return (
    <Styled.AddonCard $selected={isSelected} {...props}>
      <Icon icon={icon} />
      <span>{name}</span>
    </Styled.AddonCard>
  )
}

export default AddonCard
