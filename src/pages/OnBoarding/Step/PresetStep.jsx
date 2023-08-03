import { Panel } from '@ynput/ayon-react-components'
import React, { useState } from 'react'
import ReleasePackage from '../../../components/Release/ReleasePreset'
import * as Styled from '../OnBoardingStep.styled'

export const PresetStep = ({ release, Footer }) => {
  const { presets, addons } = release
  const [selectedPreset, setSelectedPreset] = useState(presets[0].name)

  return (
    <Panel>
      <h2>Select a Preset</h2>
      <Styled.PresetsContainer>
        {presets.map(({ name, ...props }) => (
          <ReleasePackage
            key={name}
            name={name}
            {...props}
            isSelected={selectedPreset === name}
            onClick={() => setSelectedPreset(name)}
            addons={addons.filter((addon) => addon.tags.includes(props.tag))}
          />
        ))}
      </Styled.PresetsContainer>
      <Footer next="Pick Addons" back={null} />
    </Panel>
  )
}
