import React, { useEffect, useState } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '/src/components/AddonCard/AddonCard'

export const AddonSelectStep = ({
  release,
  Footer,
  selectedAddons,
  setSelectedAddons,
  onSubmit,
}) => {
  const { addons } = release

  const [sortedAddons, setSortedAddons] = useState([])

  useEffect(() => {
    // order addons by selected
    const sorted = addons.sort((a, b) => {
      const aSelected = selectedAddons.includes(a.name)
      const bSelected = selectedAddons.includes(b.name)
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      return 0
    })
    setSortedAddons(sorted)
  }, [])

  const handleAddonClick = (name) => {
    // if it's already selected, remove it
    if (selectedAddons.includes(name)) {
      if (name === 'Core') {
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
            style={{ opacity: addon.name === 'Core' ? 0.5 : 1 }}
          />
        ))}
      </Styled.AddonsContainer>
      <Footer next="Confirm" onNext={onSubmit} />
    </Styled.Section>
  )
}
