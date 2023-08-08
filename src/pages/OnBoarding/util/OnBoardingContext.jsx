// holds stageIndex state and provides functions to update it
// gets addonsList
// get server info
import React, { createContext, useEffect, useMemo, useState } from 'react'
import { useGetYnputConnectionsQuery } from '/src/services/ynputConnect'
import {
  useGetInstallEventsQuery,
  useGetReleaseQuery,
  useInstallPresetMutation,
  useLazyGetReleaseQuery,
} from '/src/services/onBoarding/onBoarding'
import { useGetReleasesQuery } from '/src/services/getRelease'

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
  const { data: ynputConnect, isLoading: isLoadingConnect } = useGetYnputConnectionsQuery({})

  // get releases data
  const { data: releases = [], isLoading: isLoadingReleases } = useGetReleasesQuery()

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
  const [selectedPreset, setSelectedPreset] = useState(null)

  // step 4
  const [selectedAddons, setSelectedAddons] = useState([])

  // get selected release data
  const { data: release = {} } = useGetReleaseQuery(
    { name: selectedPreset },
    { skip: !selectedPreset },
  )
  // lazy
  const [getRelease] = useLazyGetReleaseQuery()

  // once releases are loaded, set selectedPreset to the first one and pre-cache each release
  useEffect(() => {
    if (releases.length) {
      setSelectedPreset(releases[0].name)
      releases.forEach(({ name }) => getRelease({ name }))
    }
  }, [releases])

  // set installing
  const [idsInstalling, setIdsInstalling] = useState([])
  const eventIds = useMemo(
    () => idsInstalling.filter((i) => i.eventId).map((i) => i.eventId),
    [idsInstalling],
  )

  // when selectedPreset changes, update selectedAddons
  useEffect(
    () => setSelectedAddons(releases.find(({ name }) => name === selectedPreset)?.addons || []),
    [selectedPreset],
  )

  const [installPreset] = useInstallPresetMutation()
  const { data: installProgress } = useGetInstallEventsQuery(
    { ids: eventIds },
    { skip: !eventIds.length },
  )

  const handleSubmit = async () => {
    // install addons, installers, dep packages
    try {
      // create array of addon urls based on selected addons
      const addons = release.addons
        .filter((addon) => selectedAddons.includes(addon.name) && !!addon.url)
        .map((addon) => ({ url: addon.url }))

      // sources = [{type: url, url: 'https://...'}, {type: file, url: 'filename.exe'}}]
      // for every installer, get all the sources urls and filter out the ones that are not urls
      const installers = release.installers.reduce((acc, installer) => {
        const sources = installer.sources.filter(({ type, url }) => type === 'url' && !!url)
        return [...acc, ...sources.map(({ url }) => ({ url, data: installer }))]
      }, [])

      // same as above but for dep packages
      const depPackages = release.dependencyPackages.reduce((acc, depPackage) => {
        const sources = depPackage.sources.filter(({ type, url }) => type === 'url' && !!url)
        return [...acc, ...sources.map(({ url }) => ({ url, data: depPackage }))]
      }, [])

      // got to next step
      nextStep()

      console.log({ addons, installers, depPackages })
      const eventIds = await installPreset({ addons, installers, depPackages }).unwrap()
      // when we do this, getInstallEventsQuery will create an initial query and then sub to the topic "addon.install_from_url"
      // as the events come in, the query will update and we can use the data to show progress
      setIdsInstalling(eventIds)
    } catch (error) {
      console.error(error)
    }
  }

  const onFinish = () => {
    console.log('finishing setup')
    //
  }

  const contextValue = {
    stepIndex,
    setStepIndex,
    releases,
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
    isLoadingConnect,
    installProgress,
    idsInstalling,
    onFinish,
    isLoadingReleases,
  }

  return <OnBoardingContext.Provider value={contextValue}>{children}</OnBoardingContext.Provider>
}

export default OnBoardingProvider
