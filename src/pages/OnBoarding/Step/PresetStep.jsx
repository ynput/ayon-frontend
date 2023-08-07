import React from 'react'
import ReleasePackage from '../../../components/Release/ReleasePreset'
import * as Styled from '../util/OnBoardingStep.styled'

export const PresetStep = ({ release, Footer, selectedPreset, setSelectedPreset }) => {
  const { presets, addons } = release

  return (
    <Styled.Section>
      <h2>Select a Release Package</h2>
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
    </Styled.Section>
  )
}
