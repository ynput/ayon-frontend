import React, { useEffect, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '/src/components/AddonCard/AddonCard'
import release from '../util/release.230807.json'

export const AddonSelectStep = ({ Footer, selectedAddons, setSelectedAddons, onSubmit }) => {
  // FIX: get release by name from /api/onboarding/release/:name
  // for now import release.230807.json

  const [sortedAddons, setSortedAddons] = useState([])

  useEffect(() => {
    // order addons by selected and then by addon.required
    const sorted = release.addons.sort((a, b) => {
      const aSelected = selectedAddons.includes(a.name)
      const bSelected = selectedAddons.includes(b.name)
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      if (a.required && !b.required) return -1
      if (!a.required && b.required) return 1
      return 0
    })
    setSortedAddons(sorted)
  }, [release])

  const handleAddonClick = (name) => {
    const addon = release.addons.find((addon) => addon.name === name)
    if (!addon) return
    // if it's already selected, remove it
    if (selectedAddons.includes(name)) {
      if (addon.required) {
        return // prevent removing the "Core" addon
      }
      setSelectedAddons(selectedAddons.filter((addon) => addon !== name))
    } else {
      setSelectedAddons([...selectedAddons, name])
    }
  }

  return (
    <Styled.Section>
      <h2>Pick your Addons</h2>
      <Styled.AddonsContainer>
        {sortedAddons.map((addon) => (
          <AddonCard
            key={addon.name}
            name={addon.name}
            icon="check_circle"
            isSelected={selectedAddons.includes(addon.name)}
            onClick={() => handleAddonClick(addon.name)}
            style={{ opacity: addon.required ? 0.5 : 1 }}
          />
        ))}
      </Styled.AddonsContainer>
      <Footer next="Confirm" onNext={onSubmit} />
    </Styled.Section>
  )
}
