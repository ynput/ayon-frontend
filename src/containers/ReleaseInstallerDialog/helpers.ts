import { BundleModel } from '@api/rest/bundles'
import { ReleaseListItemModel } from '@api/rest/releases'
import { getPlatformLabel } from '@pages/AccountPage/DownloadsPage/DownloadsPage'
import { GetReleaseInfoApiResponse, SourceModel } from '@api/rest/releases'
import { Installer } from '@api/rest/installers'
import { formatDistance } from 'date-fns'
import { ReleaseForm } from './hooks/useReleaseForm'
import { DependencyPackage } from '@api/rest/dependencyPackages'
import { DownloadAddonsApiArg } from '@queries/addons/updateAddons'

export const createReleaseSubtitle = (
  release: { name: string; createdAt: string } | null,
): string => {
  if (!release) return 'loading...'
  const releaseVersion = release.name.split('-')[0]
  return `Ynput - ${releaseVersion} - ${formatDistance(new Date(release.createdAt), new Date(), {
    addSuffix: true,
  })}`
}

export const createAddonsSubtitle = (releaseAddons: string[], selectedAddons: string[]): string => {
  if (releaseAddons.length === 0) return 'loading...'
  const matchingAddons = selectedAddons.filter((addon) => releaseAddons.includes(addon))
  return `${matchingAddons.length} selected out of ${releaseAddons.length} available`
}

export const createInstallersSubtitle = (platform: string[]): string => {
  if (platform.length === 0) return 'None selected'
  // replace darwin with macOS and return string
  return platform.map((installer) => getPlatformLabel(installer)).join(', ')
}

export const resolveRelease = (releases: ReleaseListItemModel[], selected?: string | null) => {
  if (!releases.length) return null
  // find selected release otherwise return first
  return releases.find((release) => release.name === selected) || releases[0]
}

// isProduction then isStaging then isDev then last created
export const getHighestBundle = (bundles: BundleModel[]): BundleModel | null => {
  if (!bundles.length) return null

  const selectedBundle = bundles.find((bundle) => bundle.isProduction) || null

  return selectedBundle
}

export const guessPlatform = () => {
  let platform

  //@ts-ignore
  if (navigator.userAgentData && navigator.userAgentData.platform) {
    //@ts-ignore
    platform = navigator.userAgentData.platform?.toLowerCase()
  }

  if (!platform) return null

  if (platform.includes('win')) return 'windows'
  if (platform.includes('mac')) return 'darwin'
  if (platform.includes('linux')) return 'linux'
  return null
}

export const resolveFormValidity = (form: ReleaseForm) => {
  const { addons, platforms } = form
  return addons.length > 0 && platforms.length > 0
}

export type InstallInstaller = {
  url: SourceModel['url']
  installer: Installer
}

export type InstallDependencyPackage = {
  url: SourceModel['url']
  dependencyPackage: DependencyPackage
}

export const getReleaseInstallUrls = (
  release: GetReleaseInfoApiResponse,
  selectedAddons: string[],
  selectedPlatforms: string[],
): {
  addonInstalls: DownloadAddonsApiArg['addons']
  installerInstalls: InstallInstaller[]
  dependencyPackageInstalls: InstallDependencyPackage[]
} => {
  const { addons = [], installers = [], dependencyPackages = [] } = release

  const addonInstalls = addons
    .filter((addon) => selectedAddons.includes(addon.name) && !!addon.url)
    .map((addon) => ({ url: addon.url as string, name: addon.name, version: addon.version }))

  const installerInstalls = installers
    .filter((installer) => selectedPlatforms.includes(installer.platform))
    .reduce<InstallInstaller[]>((acc, installer) => {
      const sources = (installer.sources || []).filter(({ type, url }) => type === 'http' && !!url)
      return [
        ...acc,
        ...sources.map(({ url }) => ({
          url,
          installer,
        })),
      ]
    }, [])
  const dependencyPackageInstalls = dependencyPackages
    .filter((dependencyPackage) => selectedPlatforms.includes(dependencyPackage.platform))
    .reduce<InstallDependencyPackage[]>((acc, dependencyPackage) => {
      const sources = (dependencyPackage.sources || []).filter(
        ({ type, url }) => type === 'http' && !!url,
      )
      return [
        ...acc,
        ...sources.map(({ url }) => ({
          url,
          dependencyPackage,
        })),
      ]
    }, [])

  return { addonInstalls, installerInstalls, dependencyPackageInstalls }
}
