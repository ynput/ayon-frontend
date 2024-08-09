import React from 'react'
import ReleasePreset from '@components/Release/ReleasePreset'
import * as Styled from '../util/OnBoardingStep.styled'

export const ReleaseSelect = ({
  releases,
  Header,
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
      <Header>Select a Release Package</Header>
      <Styled.PresetsContainer>
        {releases.map(({ name, ...props }, i) => (
          <ReleasePreset
            index={i}
            key={name}
            name={name}
            isSelected={selectedPreset === name}
            isLoading={isLoadingReleases}
            onClick={() => setSelectedPreset(name)}
            {...props}
          />
        ))}
      </Styled.PresetsContainer>
      <Footer next="Continue" back={null} />
    </Styled.Section>
  )
}
