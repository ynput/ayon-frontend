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
import { useRestart } from '@context/restartContext'
import { useCreateBundleMutation } from '@queries/bundles/updateBundles'

interface ReleaseInstallerProps {
  onFinish: () => void
}

const ReleaseInstaller: FC<ReleaseInstallerProps> = ({ onFinish }) => {
  const dispatch = useAppDispatch()
  const selectedRelease = useAppSelector((state) => state.releaseInstaller.release)
  const dialog = useAppSelector((state) => state.releaseInstaller.dialog)

  // QUERIES
  //   get latest releases
  const {
    data: { releases = [] } = {},
    isLoading: isLoadingReleases,
    error,
  } = useGetReleasesQuery()
  const releasesError = (!releases.length && !isLoadingReleases) || error

  // get all bundles
  const { data: { bundles = [] } = {}, isLoading: isLoadingBundles } = useListBundlesQuery({
    archived: false,
  })
  const bundlesError = !bundles.length && !isLoadingBundles

  // QUERIES

  // Select release based on selectedRelease otherwise first release
  const release = resolveRelease(releases, selectedRelease)
  // we use this bundle to preselect which addons are installed from the release
  const bundle = getHighestBundle(bundles)

  const [releaseForm, setReleaseForm] = useReleaseForm({ release, bundle })

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
  const anyError = releasesError || bundlesError || releaseInfoError

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
  const handleInstallComplete = (restart: boolean) => {
    // reset events
    setEvents([])
    // close dialog
    onFinish()
    if (releaseInfo) {
      // build new bundle from release
      const bundle = createBundleFromRelease(
        releaseInfo,
        releaseForm.addons,
        releaseForm.platforms,
        bundles,
      )

      // then create the bundle
      createBundle({ data: bundle, force: true }).unwrap()
    }
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
        <ReleaseInstallerProgress progress={installProgress} onFinish={handleInstallComplete} />
      )
    default:
      break
  }
}

export default ReleaseInstaller
