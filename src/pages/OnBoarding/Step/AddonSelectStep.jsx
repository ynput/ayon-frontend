import React, { useEffect, useMemo, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '/src/components/AddonCard/AddonCard'

export const AddonSelectStep = ({
  Header,
  Footer,
  selectedAddons = [],
  selectedPreset,
  releases = [],
  setSelectedAddons,
  onSubmit,
  isLoadingRelease,
}) => {
  // FIX: get release by name from /api/onboarding/release/:name
  // for now import release.230807.json

  const [sortedAddons, setSortedAddons] = useState([])

  const release = useMemo(
    () => releases.find((release) => release.name === selectedPreset),
    [selectedPreset, releases],
  )
  const addons = useMemo(() => release?.addons || [], [release])
  const mandatory = useMemo(() => release?.mandatoryAddons || [], [release])

  useEffect(() => {
    const sortedAddons = [...addons]
    // order addons by selected and then by addon.mandatory
    sortedAddons.sort((a, b) => {
      const aSelected = selectedAddons.includes(a)
      const bSelected = selectedAddons.includes(b)
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      if (mandatory.includes(a) && !mandatory.includes(b)) return -1
      if (!mandatory.includes(a) && mandatory.includes(b)) return 1
      return 0
    })
    setSortedAddons(sortedAddons)
  }, [releases])

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
        {sortedAddons.map(
          (addon) =>
            !mandatory.includes(addon) && (
              <AddonCard
                key={addon}
                name={addon}
                icon={selectedAddons.includes(addon) ? 'check_circle' : 'circle'}
                isSelected={selectedAddons.includes(addon)}
                onClick={() => handleAddonClick(addon)}
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
