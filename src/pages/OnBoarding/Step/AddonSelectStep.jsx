import React, { useEffect, useMemo, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '/src/components/AddonCard/AddonCard'
import { useGetReleaseQuery } from '/src/services/onBoarding/onBoarding'

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

  const { data: currentRelease = {} } = useGetReleaseQuery(
    { name: selectedPreset },
    { skip: !selectedPreset },
  )

  const release = useMemo(
    () => releases.find((release) => release.name === selectedPreset),
    [selectedPreset, releases],
  )
  const addons = useMemo(() => currentRelease?.addons || [], [currentRelease])
  const mandatory = useMemo(() => release?.mandatoryAddons || [], [release])

  useEffect(() => {
    const sortedAddons = [...addons]
    // order addons by selected and then by addon.mandatory
    sortedAddons.sort((a, b) => {
      const aSelected = selectedAddons.includes(a.name)
      const bSelected = selectedAddons.includes(b.name)
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      if (mandatory.includes(a.name) && !mandatory.includes(b.name)) return -1
      if (!mandatory.includes(a.name) && mandatory.includes(b.name)) return 1
      return 0
    })
    setSortedAddons(sortedAddons)
  }, [releases, currentRelease])

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
         {sortedAddons.map((addon) => 
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
