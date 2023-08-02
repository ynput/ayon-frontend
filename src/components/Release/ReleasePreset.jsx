import React from 'react'
import * as Styled from './ReleasePreset.styled'
import { Icon } from '@ynput/ayon-react-components'

const ReleasePreset = ({ addons, name, bio, icon, isSelected, ...props }) => {
  return (
    <Styled.Preset $selected={isSelected} {...props}>
      <Styled.Header>
        <Icon icon={icon} />
        <div>
          <h3>{name}</h3>
          <span>{bio}</span>
        </div>
      </Styled.Header>
      {isSelected && (
        <Styled.Addons>Addons {addons.map((addon) => addon.name).join(', ')}</Styled.Addons>
      )}
    </Styled.Preset>
  )
}

export default ReleasePreset
