import React, { useMemo } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '/src/components/AddonCard/AddonCard'

export const AddonSelectStep = ({
  Header,
  Footer,
  selectedAddons = [],
  selectedPreset,
  releases = [],
  release = {},
  setSelectedAddons,
  onSubmit,
  isLoadingRelease,
  isLoadingAddons,
}) => {
  const currentRelease = useMemo(
    () => releases.find((release) => release.name === selectedPreset),
    [selectedPreset, releases],
  )
  const { mandatoryAddons: mandatory = [] } = currentRelease || {}
  const { addons = [] } = release || {}

  const handleAddonClick = (name) => {
    // if it's already selected, remove it
    if (selectedAddons.includes(name)) {
      setSelectedAddons(selectedAddons.filter((addon) => addon !== name))
    } else {
      setSelectedAddons([...selectedAddons, name])
    }
  }

  // selected release has addons length, so use that as placeholders
  const placeholders = currentRelease?.addons || [...Array(20)].map((_, i) => `Addon ${i}`)

  return (
    <Styled.Section>
      <Header>Pick your Addons</Header>
      <Styled.AddonsContainer>
        {isLoadingAddons
          ? placeholders.map((placeholder) => (
              <Styled.PlaceholderCard key={placeholder} icon={''} />
            ))
          : addons.map(
              (addon) =>
                !mandatory.includes(addon.name) && (
                  <AddonCard
                    key={addon.name}
                    title={addon.title}
                    name={addon.name}
                    version={addon.version}
                    icon={selectedAddons.includes(addon.name) ? 'check_circle' : 'circle'}
                    isSelected={selectedAddons.includes(addon.name)}
                    onClick={() => handleAddonClick(addon.name)}
                  />
                ),
            )}
      </Styled.AddonsContainer>
      <Footer
        next="Confirm"
        onNext={onSubmit}
        nextProps={{ saving: isLoadingRelease }}
        showIcon={isLoadingRelease}
      />
    </Styled.Section>
  )
}
