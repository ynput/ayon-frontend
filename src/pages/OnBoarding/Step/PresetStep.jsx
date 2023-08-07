import React from 'react'
import ReleasePackage from '../../../components/Release/ReleasePreset'
import * as Styled from '../util/OnBoardingStep.styled'

export const PresetStep = ({ releases, Footer, selectedPreset, setSelectedPreset }) => {
  return (
    <Styled.Section>
      <h2>Select a Release Package</h2>
      <Styled.PresetsContainer>
        {releases.map(({ name, ...props }) => (
          <ReleasePackage
            key={name}
            name={name}
            {...props}
            isSelected={selectedPreset === name}
            onClick={() => setSelectedPreset(name)}
          />
        ))}
      </Styled.PresetsContainer>
      <Footer next="Pick Addons" back={null} />
    </Styled.Section>
  )
}
