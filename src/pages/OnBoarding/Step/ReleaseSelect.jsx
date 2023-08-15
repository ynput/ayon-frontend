import React from 'react'
import ReleasePackage from '../../../components/Release/ReleasePreset'
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
      <Footer next="Continue" back={null} />
    </Styled.Section>
  )
}
