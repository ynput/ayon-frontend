import React, { useEffect, useMemo, useState } from 'react'
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

  const [sortedAddons, setSortedAddons] = useState([])


   const currentRelease = useMemo(
     () => releases.find((release) => release.name === selectedPreset),
     [selectedPreset, releases],
   )
  const addons = useMemo(() => release?.addons || [], [release])
  const mandatory = useMemo(() => currentRelease?.mandatoryAddons || [], [currentRelease])

  useEffect(() => {
    const sortedAddons = [...addons]
    // order addons by selected and then by addon.mandatory
    sortedAddons.sort((a, b) => {
      const aSelected = selectedAddons.includes(a.name)
      const bSelected = selectedAddons.includes(b.name)
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      return 0
    })
    setSortedAddons(sortedAddons)
  }, [releases, release])

  const handleAddonClick = (name) => {
    // if it's already selected, remove it
    if (selectedAddons.includes(name)) {
      setSelectedAddons(selectedAddons.filter((addon) => addon !== name))
    } else {
      setSelectedAddons([...selectedAddons, name])
    }
  }

  const placeholders = [...Array(20)].map((_, i) => ({name: `Addon ${i}`}))

  return (
    <Styled.Section>
      <Header>Pick your Addons</Header>
      <Styled.AddonsContainer>
        {!isLoadingAddons
        ? 
          placeholders.map((placeholder) => (
              <Styled.PlaceholderCard
                key={placeholder.name}
                icon={''}
            />
          ))
        :
          sortedAddons.map((addon) => 
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
          ))
        }
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
