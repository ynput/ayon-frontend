// holds stageIndex state and provides functions to update it
// gets addonsList
// get server info
import React, { createContext, useState } from 'react'

export const OnBoardingContext = createContext()

export const OnBoardingProvider = ({ children, serverInfo }) => {
  const [stepIndex, setStepIndex] = useState(0)
  const [addonsList, setAddonsList] = useState([])
  const previousStep = () => setStepIndex(stepIndex - 1)
  const nextStep = () => setStepIndex(stepIndex + 1)

  const contextValue = {
    stepIndex,
    setStepIndex,
    addonsList,
    setAddonsList,
    serverInfo,
    nextStep,
    previousStep,
  }

  return <OnBoardingContext.Provider value={contextValue}>{children}</OnBoardingContext.Provider>
}

export default OnBoardingProvider
