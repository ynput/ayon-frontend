// holds stageIndex state and provides functions to update it
// gets addonsList
// get server info
import React, { createContext, useEffect, useState } from 'react'
import release from './releaseData'

export const OnBoardingContext = createContext()

export const OnBoardingProvider = ({ children, serverInfo }) => {
  const [stepIndex, setStepIndex] = useState(0)
  const previousStep = () => setStepIndex(stepIndex - 1)
  const nextStep = () => setStepIndex(stepIndex + 1)

  // step 1
  const [selectedPreset, setSelectedPreset] = useState(release.presets[0].name)
  // step 2
  const [selectedAddons, setSelectedAddons] = useState([])

  // when selectedPreset changes, update selectedAddons
  useEffect(
    () =>
      setSelectedAddons(
        release.addons
          .filter((addon) =>
            addon.tags.includes(
              release.presets.find((preset) => preset.name === selectedPreset).tag,
            ),
          )
          .map((addon) => addon.name),
      ),
    [selectedPreset],
  )

  const handleSubmit = () => {
    console.log('submitting')
  }

  const contextValue = {
    stepIndex,
    setStepIndex,
    release,
    serverInfo,
    nextStep,
    previousStep,
    selectedPreset,
    setSelectedPreset,
    selectedAddons,
    setSelectedAddons,
    onSubmit: handleSubmit,
  }

  return <OnBoardingContext.Provider value={contextValue}>{children}</OnBoardingContext.Provider>
}

export default OnBoardingProvider
