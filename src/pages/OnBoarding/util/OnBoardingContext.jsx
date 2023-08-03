// holds stageIndex state and provides functions to update it
// gets addonsList
// get server info
import React, { createContext, useEffect, useState } from 'react'
import release from './releaseData'
import { useGetYnputConnectionsQuery } from '/src/services/ynputConnect'

const userFormFields = [
  {
    id: 'name',
    label: 'Username',
    type: 'text',
    required: true,
  },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    required: true,
  },
  {
    id: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    required: true,
  },
  {
    id: 'email',
    label: 'Email (optional)',
    type: 'email',
  },
  {
    id: 'fullName',
    label: 'Full Name (optional)',
    type: 'text',
  },
]

export const OnBoardingContext = createContext()

export const OnBoardingProvider = ({ children, initStep }) => {
  // get ynput connect data
  const { data: ynputConnect } = useGetYnputConnectionsQuery()

  const [stepIndex, setStepIndex] = useState(initStep)
  const previousStep = () => setStepIndex(stepIndex - 1)
  const nextStep = () => setStepIndex(stepIndex + 1)

  const initUserForm = userFormFields.reduce((acc, field) => {
    acc[field.id] = ''
    return acc
  }, {})

  // console.log({ ynputConnect })
  // step 2
  const [userForm, setUserForm] = useState(initUserForm)
  // step 3
  const [selectedPreset, setSelectedPreset] = useState(release.presets[0].name)
  // step 4
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
    nextStep,
    previousStep,
    selectedPreset,
    setSelectedPreset,
    selectedAddons,
    setSelectedAddons,
    onSubmit: handleSubmit,
    setUserForm,
    userForm,
    userFormFields,
    ynputConnect,
  }

  return <OnBoardingContext.Provider value={contextValue}>{children}</OnBoardingContext.Provider>
}

export default OnBoardingProvider
