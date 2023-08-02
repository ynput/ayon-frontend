// holds stageIndex state and provides functions to update it
// gets addonsList
// get server info
import React, { createContext, useState } from 'react'
import { useGetAddonListQuery } from '/src/services/addonList'

export const OnBoardingContext = createContext()

export const OnBoardingProvider = ({ children, serverInfo }) => {
  const [stepIndex, setStepIndex] = useState(0)
  const previousStep = () => setStepIndex(stepIndex - 1)
  const nextStep = () => setStepIndex(stepIndex + 1)

  // get addons list
  const { data: addons } = useGetAddonListQuery()

  const contextValue = {
    stepIndex,
    setStepIndex,
    addons,
    serverInfo,
    nextStep,
    previousStep,
  }

  return <OnBoardingContext.Provider value={contextValue}>{children}</OnBoardingContext.Provider>
}

export default OnBoardingProvider
