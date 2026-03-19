import { FC } from 'react'

// State
import { useAppDispatch, useAppSelector } from '@state/store'

// Queries
import { useGetReleasesQuery } from '@queries/releases/getReleases'
import { useListBundlesQuery } from '@queries/bundles/getBundles'

// Components
import { ReleaseInstallerError } from './components'
import {
  ReleaseInstallerOverview,
  ReleaseInstallerAddons,
  ReleaseInstallerPlatforms,
  ReleaseInstallerProgress,
} from './forms'

// Helpers
import {
  getHighestBundle,
  resolveRelease,
  resolveFormValidity,
  createBundleFromRelease,
} from './helpers'
import { useInstallRelease, useReleaseForm, useReleaseInfo } from './hooks'
import { ReleaseFormType, switchDialog } from '@state/releaseInstaller'
import { useRestart } from '@context/RestartContext'
import { useCreateBundleMutation } from '@queries/bundles/updateBundles'
import { useNavigate } from 'react-router-dom'
import { useListAddonsQuery } from '@shared/api'

interface ReleaseInstallerProps {
  onFinish: () => void
}

const ReleaseInstaller: FC<ReleaseInstallerProps> = ({ onFinish }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const initReleaseName = useAppSelector((state) => state.releaseInstaller.release)
  const inherit = useAppSelector((state) => state.releaseInstaller.inherit)
  const dialog = useAppSelector((state) => state.releaseInstaller.dialog)

  // QUERIES
  //   get latest releases
  const {
    data: { releases = [] } = {},
    isLoading: isLoadingReleases,
    error,
  } = useGetReleasesQuery({ all: !!initReleaseName })
  const releasesError = (!releases.length && !isLoadingReleases) || error

  // get all bundles
  const { data: { bundles = [] } = {}, isLoading: isLoadingBundles } = useListBundlesQuery({
    archived: false,
  })

  // get all installed addons - used for transferring over the server addons for the new bundle
  const { data: { addons = [] } = {} } = useListAddonsQuery({})

  // QUERIES

  // Select release based on initReleaseName otherwise first release
  const release = resolveRelease(releases, initReleaseName)
  // we use this bundle to preselect which addons are installed from the release
  const bundle = getHighestBundle(bundles)

  const [releaseForm, setReleaseForm] = useReleaseForm({ release, bundle, inherit })

  const [
    releaseInfo,
    releaseAddons,
    { isLoading: isLoadingReleaseInfo, isError: releaseInfoError },
  ] = useReleaseInfo({
    selectedRelease: releaseForm.name,
    selectedAddons: releaseForm.addons,
    release,
  })

  const isLoadingAny = isLoadingReleases || isLoadingBundles || !releaseForm.name
  const anyError = releasesError || releaseInfoError

  const handleSwitchDialog = (dialog: ReleaseFormType) => {
    dispatch(switchDialog(dialog))
  }

  const handleAddonsConfirm = (addons: string[]) => {
    setReleaseForm((prev) => ({ ...prev, addons }))
    handleSwitchDialog('overview')
  }

  const handlePlatformsConfirm = (platforms: string[]) => {
    setReleaseForm((prev) => ({ ...prev, platforms }))
    handleSwitchDialog('overview')
  }

  const handleSelectCancel = () => {
    dispatch(switchDialog('overview'))
  }

  // const fakeProgress =

  // hook logic for installing release
  const [installRelease, isSubmitting, installProgress, installError, setEvents] =
    useInstallRelease({
      releaseInfo,
      releaseForm,
    })

  const handleConfirm = async () => {
    await installRelease()
  }

  const { confirmRestart, snoozeRestart } = useRestart()

  const [createBundle] = useCreateBundleMutation()

  // create a new bundle once the release is installed
  const handleInstallFinish = async () => {
    if (!releaseInfo) return
    // build new bundle from release
    const bundle = createBundleFromRelease(
      releaseInfo,
      releaseForm.addons,
      releaseForm.platforms,
      bundles,
      addons,
    )

    // then create the bundle
    return await createBundle({ data: bundle, force: true }).unwrap()
  }

  const handleInstallComplete = async (restart: boolean) => {
    // reset events
    setEvents([])
    // close dialog
    onFinish()
    // navigate to bundles page
    navigate('/settings/bundles')
    if (restart) {
      // restart server
      confirmRestart()
    } else {
      // snooze
      snoozeRestart()
    }
  }

  if (anyError) return <ReleaseInstallerError error={error} onClose={onFinish} />

  switch (dialog) {
    case 'overview':
      return (
        <ReleaseInstallerOverview
          release={release}
          isLoading={isLoadingAny}
          isLoadingRelease={isLoadingReleaseInfo}
          releaseForm={releaseForm}
          onSwitchDialog={handleSwitchDialog}
          onCancel={onFinish}
          onConfirm={handleConfirm}
          isFormValid={resolveFormValidity(releaseForm)}
          isSubmitting={isSubmitting}
          error={installError}
        />
      )
    case 'addons':
      return (
        <ReleaseInstallerAddons
          releaseForm={releaseForm}
          releaseAddons={releaseAddons}
          mandatoryAddons={release?.mandatoryAddons || []}
          isLoading={isLoadingAny || isLoadingReleaseInfo}
          onConfirm={handleAddonsConfirm}
          onCancel={handleSelectCancel}
        />
      )
    case 'installers':
      return (
        <ReleaseInstallerPlatforms
          releaseInstallers={releaseInfo?.installers || []}
          isLoading={isLoadingAny || isLoadingReleaseInfo}
          releaseForm={releaseForm}
          onConfirm={handlePlatformsConfirm}
          onCancel={handleSelectCancel}
        />
      )
    case 'progress':
      return (
        <ReleaseInstallerProgress
          progress={installProgress}
          onInstallFinished={handleInstallFinish}
          onFinishAction={handleInstallComplete}
        />
      )
    default:
      break
  }
}

export default ReleaseInstaller
