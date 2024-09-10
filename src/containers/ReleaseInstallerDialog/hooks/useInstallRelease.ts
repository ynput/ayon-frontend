import { GetReleaseInfoApiResponse } from '@api/rest/releases'
import { ReleaseForm } from './useReleaseForm'
import { getReleaseInstallUrls } from '../helpers'
import { useAppDispatch } from '@state/store'
import { switchDialog } from '@state/releaseInstaller'
import { useCreateInstallerMutation } from '@queries/installers/updateInstallers'
import { useCreateDependencyPackageMutation } from '@queries/dependencyPackages/updateDependencyPackages'
import { DownloadAddonsApiResponse, useDownloadAddonsMutation } from '@queries/addons/updateAddons'
import { InstallResponseModel } from '@api/rest/installers'

type Props = {
  releaseInfo: GetReleaseInfoApiResponse | undefined
  releaseForm: ReleaseForm
}

export const useInstallRelease = ({ releaseInfo, releaseForm }: Props) => {
  const dispatch = useAppDispatch()

  const [createInstaller] = useCreateInstallerMutation()
  const [createDependencyPackage] = useCreateDependencyPackageMutation()
  const [downloadAddons] = useDownloadAddonsMutation()

  const installRelease = async () => {
    try {
      if (!releaseInfo) throw new Error('No release info')
      const { addonInstalls, installerInstalls, dependencyPackageInstalls } = getReleaseInstallUrls(
        releaseInfo,
        releaseForm.addons,
        releaseForm.platforms,
      )

      let promises = []
      //   create all installers from url
      for (const { url, installer } of installerInstalls) {
        const promise = createInstaller({ installer, force: true, overwrite: true, url }).unwrap()
        promises.push(promise)
      }

      //   create all dependency packages from url
      for (const { url, dependencyPackage } of dependencyPackageInstalls) {
        const promise = createDependencyPackage({
          dependencyPackage,
          force: true,
          overwrite: true,
          url,
        }).unwrap()
        promises.push(promise)
      }

      //   create all addons from url
      promises.push(downloadAddons({ addons: addonInstalls }).unwrap())

      //   move onto progress screen
      dispatch(switchDialog('progress'))

      const res = await Promise.all(promises)

      //   create a flat list of eventIds
      const eventIds = transformEventIds(res)

      console.log(eventIds)
    } catch (error) {
      console.error('Error getting release install urls', error)
    }
  }

  return installRelease
}

// creates a flat list of eventIds
const transformEventIds = (result: (InstallResponseModel | DownloadAddonsApiResponse)[]) =>
  result.flatMap((item) => {
    if (Array.isArray(item)) {
      // If it's an array, return it directly
      return item
    } else if (item?.eventId) {
      // If it's an object with an eventId, return the eventId
      return item.eventId
    }
    return []
  })
