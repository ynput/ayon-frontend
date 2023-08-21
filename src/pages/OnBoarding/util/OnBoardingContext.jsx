// holds stageIndex state and provides functions to update it
// gets addonsList
// get server info
import React, { createContext, useEffect, useMemo, useState } from 'react'
import { useGetYnputConnectionsQuery } from '/src/services/ynputConnect'
import {
  useAbortOnBoardingMutation,
  useGetInstallEventsQuery,
  useGetReleaseQuery,
  useInstallPresetMutation,
  useLazyGetReleaseQuery,
} from '/src/services/onBoarding/onBoarding'
import { useGetReleasesQuery } from '/src/services/getRelease'
import useLocalStorage from '/src/hooks/useLocalStorage'
import { useCreateBundleMutation, useLazyGetBundleListQuery } from '/src/services/bundles'
import getNewBundleName from '../../SettingsPage/Bundles/getNewBundleName'

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

const createBundleFromRelease = (release, selectedAddons, bundleList) => {
  const addons = {}
  for (const name of selectedAddons) {
    // find addon in release
    const addon = release?.addons?.find((addon) => addon?.name === name)
    if (addon) {
      addons[name] = addon.version
    }
  }

  const installerVersion = release.installers[0]?.version
  const dependencyPackages = {}
  for (const depPackage of release.dependencyPackages) {
    dependencyPackages[depPackage.platform] = depPackage.filename
  }

  const name = getNewBundleName(release.name, bundleList)

  return {
    name,
    addons,
    installerVersion,
    dependencyPackages,
    isProduction: true,
  }
}

export const OnBoardingContext = createContext()

export const OnBoardingProvider = ({ children, initStep, onFinish }) => {
  const [isConnecting, setIsConnecting] = useLocalStorage('ynput-connecting', false)

  // get ynput connect data
  const { data: ynputConnect, isLoading: isLoadingConnect } = useGetYnputConnectionsQuery({})

  // get releases data
  const { data: releases = [], isLoading: isLoadingReleases } = useGetReleasesQuery({
    ynputConnect,
  })

  const [stepIndex, setStepIndex] = useState(initStep)
  const previousStep = () => setStepIndex(stepIndex - 1)
  const nextStep = (e, skip = 0) => setStepIndex(stepIndex + 1 + skip)

  // const handleKeyPress = (e) => {
  //   //"N" key for next step, "B" key for previous step
  //   if (e.key === 'N') nextStep()
  //   if (e.key === 'B') previousStep()
  // }
  // useKeyPress(handleKeyPress)

  // when connected reset isConnecting, and go to next step
  useEffect(() => {
    if (ynputConnect && isConnecting) {
      setIsConnecting(false)
      nextStep()
    }
  }, [ynputConnect, isConnecting])

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

  // these are the event ids that are installing
  const [idsInstalling, setIdsInstalling] = useState([])
  // this is used to install addons, installers, dep packages
  const [installPreset] = useInstallPresetMutation()

  // set installing

  // when selectedPreset changes, update selectedAddons
  useEffect(
    () => setSelectedAddons(releases.find(({ name }) => name === selectedPreset)?.addons || []),
    [selectedPreset],
  )

  // starts monitoring the events
  const topics = [
    'addon.install_from_url',
    'installer.install_from_url',
    'dependency_package.install_from_url',
  ]

  const eventIds = useMemo(
    () => idsInstalling.filter((res) => res.eventId).map((res) => res.eventId),
    [idsInstalling],
  )
  const [isFinished, setIsFinished] = useState(false)
  const {
    data: installProgress,
    isSuccess,
    isFetching,
    refetch,
  } = useGetInstallEventsQuery({ topics, ids: eventIds }, { skip: !eventIds.length })

  // once installProgress is success (first time) and not fetching then refetch every 1 second
  useEffect(() => {
    if (isSuccess && !isFetching && !isFinished) {
      const interval = setInterval(() => {
        !isFetching && refetch()
      }, 1000)

      if (isFinished) clearInterval(interval)

      return () => clearInterval(interval)
    }
  }, [isSuccess, isFetching, isFinished])

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

      // create bundle we release

      // console.log({ addons, installers, depPackages })
      const eventIds = await installPreset({ addons, installers, depPackages }).unwrap()
      // when we do this, getInstallEventsQuery will create an initial query and then sub to the topic "addon.install_from_url"
      // as the events come in, the query will update and we can use the data to show progress
      setIdsInstalling(eventIds)
    } catch (error) {
      console.error(error)
    }
  }

  const [abortOnboarding] = useAbortOnBoardingMutation()

  // create bundle
  const [createBundle] = useCreateBundleMutation()
  // get bundle list so that we can make sure the bundle name is unique
  const [getBundleList] = useLazyGetBundleListQuery()
  const handleFinish = async (restart, skip = false) => {
    try {
      if (!skip) {
        // get bundle list
        const bundleList = (await getBundleList({ archived: true }).unwrap()) || []
        // first create the bundle from the release
        const bundle = createBundleFromRelease(release, selectedAddons, bundleList)

        await createBundle({ data: bundle }).unwrap()
      }
      await abortOnboarding().unwrap()

      onFinish(restart)
    } catch (error) {
      console.error(error)
    }
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
    isFinished,
    setIsFinished,
    onFinish: handleFinish,
    isLoadingReleases,
    setIsConnecting,
    isConnecting,
  }

  return <OnBoardingContext.Provider value={contextValue}>{children}</OnBoardingContext.Provider>
}

export default OnBoardingProvider
