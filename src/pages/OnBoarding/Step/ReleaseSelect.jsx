import React from 'react'
import ReleasePackage from '../../../components/Release/ReleasePreset'
import * as Styled from '../util/OnBoardingStep.styled'

export const ReleaseSelect = ({
  releases,
  Footer,
  selectedPreset,
  setSelectedPreset,
  isLoadingReleases,
}) => {
  // create array of 4 loading releases
  const loadingReleases = Array.from({ length: 4 }, (_, i) => ({
    name: `loading-${i}`,
    label: `Loading ${i}`,
    icon: 'check_circle',
    isLoading: true,
    addons: ['core'],
  }))

  if (isLoadingReleases) {
    releases = loadingReleases
  }

  return (
    <Styled.Section>
      <h2>Select a Release Package</h2>
      <Styled.PresetsContainer>
        {releases.map(({ name, ...props }, i) => (
          <ReleasePackage
            index={i}
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
