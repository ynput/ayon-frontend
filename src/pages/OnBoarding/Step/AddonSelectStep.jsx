import React, { useMemo } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '@components/AddonCard/AddonCard'

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
  const { addons = [] } = release || {}
  // filter out mandatory addons
  const notMandatoryAddons = addons.filter((addon) => !addon.mandatory)

  // get placeholders for loading
  const placeholders = useMemo(() => {
    const currentRelease = releases.find((release) => release.name === selectedPreset)
    const notMandatorAddons = currentRelease?.addons.filter(
      (addon) => !currentRelease?.mandatoryAddons?.includes(addon),
    )
    return notMandatorAddons || [...Array(20)].map((_, i) => `Addon ${i}`)
  }, [selectedPreset, releases])

  const handleAddonClick = (name) => {
    // if it's already selected, remove it
    if (selectedAddons.includes(name)) {
      setSelectedAddons(selectedAddons.filter((addon) => addon !== name))
    } else {
      setSelectedAddons([...selectedAddons, name])
    }
  }

  return (
    <Styled.Section>
      <Header>Pick your Addons</Header>
      <Styled.AddonsContainer>
        {isLoadingAddons
          ? placeholders.map((placeholder) => (
              <Styled.PlaceholderCard key={placeholder} icon={''} />
            ))
          : notMandatoryAddons.map((addon) => (
              <AddonCard
                key={addon.name}
                title={addon.title}
                name={addon.name}
                version={addon.version}
                icon={selectedAddons.includes(addon.name) ? 'check_circle' : 'circle'}
                isSelected={selectedAddons.includes(addon.name)}
                onClick={() => handleAddonClick(addon.name)}
              />
            ))}
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
