// holds stageIndex state and provides functions to update it
// gets addonsList
// get server info
import React, { createContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useGetYnputConnectionsQuery } from '@queries/ynputConnect'
import {
  useAbortOnBoardingMutation,
  useInstallPresetMutation,
} from '@queries/onBoarding/onBoarding'
import {
  useGetReleasesQuery,
  useGetReleaseInfoQuery,
  useLazyGetReleaseInfoQuery,
  useGetInstallEventsQuery,
} from '@queries/releases/getReleases'
import { useLocalStorage } from '@shared/hooks'
import { useLazyListBundlesQuery } from '@queries/bundles/getBundles'
import { useCreateBundleMutation } from '@queries/bundles/updateBundles'
import { createBundleFromRelease, guessPlatform } from '@containers/ReleaseInstallerDialog/helpers'

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

export const OnBoardingProvider = ({ children, initStep, onFinish }) => {
  const [isConnecting, setIsConnecting] = useLocalStorage('ynput-connecting', false)

  // get ynput connect data
  const { data: ynputConnect, isLoading: isLoadingConnect } = useGetYnputConnectionsQuery({})

  // get releases data
  const { data: { releases = [] } = {}, isLoading: isLoadingReleases } = useGetReleasesQuery(
    {
      ynputConnect,
    },
    { skip: !ynputConnect },
  )

  const [stepIndex, setStepIndex] = useState(initStep)
  const previousStep = () => setStepIndex(stepIndex - 1)
  const nextStep = (e, skip = 0) => setStepIndex(stepIndex + 1 + skip)

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
  // step 5
  const [selectedPreset, setSelectedPreset] = useState(null)

  // step 6
  const [selectedAddons, setSelectedAddons] = useState([])

  // step 7
  // guess the users operating system
  const guessedPlatform = useMemo(() => guessPlatform(), [])

  const [selectedPlatforms, setSelectedPlatforms] = useState(
    guessedPlatform ? [guessedPlatform] : [],
  )

  // get selected release data
  const { data: release = {}, isFetching: isLoadingAddons } = useGetReleaseInfoQuery(
    { releaseName: selectedPreset },
    { skip: !selectedPreset || stepIndex < 5 },
  )

  // // once releases are loaded, set selectedPreset to the first one and pre-cache each release
  useEffect(() => {
    if (releases.length) {
      setSelectedPreset(releases[0].name)
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
  } = useGetInstallEventsQuery({ ids: eventIds }, { skip: !eventIds.length })

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

  const [getRelease, { isFetching: isLoadingRelease }] = useLazyGetReleaseInfoQuery()

  const handleSubmit = async () => {
    // install addons, installers, dep packages
    try {
      // get release data
      const release = await getRelease({ releaseName: selectedPreset }).unwrap()
      // create array of addon urls based on selected addons
      const addons = release.addons
        .filter((addon) => selectedAddons.includes(addon.name) && !!addon.url)
        .map((addon) => ({ url: addon.url }))

      // sources = [{type: url, url: 'https://...'}, {type: file, url: 'filename.exe'}]
      // for every installer, get all the sources urls and filter out the ones that are not urls
      const installers = release.installers
        .filter((installer) => selectedPlatforms.includes(installer.platform)) // Filter installers by selected platforms
        .reduce((acc, installer) => {
          const sources = installer.sources.filter(({ type, url }) => type === 'http' && !!url)
          return [...acc, ...sources.map(({ url }) => ({ url, data: installer }))]
        }, [])

      // same as above but for dep packages
      const depPackages = release.dependencyPackages
        .filter((depPackage) => selectedPlatforms.includes(depPackage.platform))
        .reduce((acc, depPackage) => {
          const sources = depPackage.sources.filter(({ type, url }) => type === 'http' && !!url)
          return [...acc, ...sources.map(({ url }) => ({ url, data: depPackage }))]
        }, [])

      // go to next step
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
  const [listBundles] = useLazyListBundlesQuery()
  const handleFinish = async (restart, skip = false) => {
    try {
      if (!skip) {
        // get bundle list
        const { bundles: bundleList = [] } = (await listBundles({ archived: true }).unwrap()) || {}
        // first create the bundle from the release
        const bundle = createBundleFromRelease(
          release,
          selectedAddons,
          selectedPlatforms,
          bundleList,
        )

        await createBundle({ data: bundle, force: true }).unwrap()
      }
      await abortOnboarding().unwrap()
    } catch (error) {
      console.error(error)
      toast.error('Please create your production bundle manually after restarting the server.')
    }
    onFinish(restart)
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
    selectedPlatforms,
    setSelectedPlatforms,
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
    isLoadingRelease,
    isLoadingAddons,
  }

  return <OnBoardingContext.Provider value={contextValue}>{children}</OnBoardingContext.Provider>
}

export default OnBoardingProvider
