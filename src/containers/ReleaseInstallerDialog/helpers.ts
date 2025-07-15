import type {
  BundleModel,
  ReleaseListItemModel,
  Installer,
  DependencyPackage,
  GetReleaseInfoApiResponse,
  SourceModel,
  AddonListItem,
} from '@shared/api'
import { getPlatformLabel } from '@pages/AccountPage/DownloadsPage/DownloadsPage'
import { formatDistance } from 'date-fns'
import { ReleaseForm } from './hooks/useReleaseForm'
import { DownloadAddonsApiArg } from '@shared/api'
import getNewBundleName from '@pages/SettingsPage/Bundles/getNewBundleName'

export const createReleaseSubtitle = (
  release: { name?: string; createdAt: string } | null,
): string => {
  if (!release) return 'loading...'
  const releaseVersion = release.name ? release.name.split('-')[0] : ''
  const versionText = releaseVersion ? `Ynput - ${releaseVersion} - ` : 'Ynput - '
  return `${versionText}${formatDistance(new Date(release.createdAt), new Date(), {
    addSuffix: true,
  })}`.replace('about ', '')
}

export const createAddonsSubtitle = (releaseAddons: string[], selectedAddons: string[]): string => {
  if (releaseAddons.length === 0) return 'loading...'
  const matchingAddons = selectedAddons.filter((addon) => releaseAddons.includes(addon))
  return `${matchingAddons.length} selected out of ${releaseAddons.length} available`
}

export const createInstallersSubtitle = (platform: string[]): string => {
  if (platform.length === 0) return 'None selected'
  // replace darwin with macOS and return string
  const uniquePlatforms = Array.from(new Set(platform))
  return uniquePlatforms.map((installer) => getPlatformLabel(installer)).join(', ')
}

export const resolveRelease = (releases: ReleaseListItemModel[], selected?: string | null) => {
  if (!releases.length) return null
  // find selected release otherwise return first
  return releases.find((release) => release.name === selected) || releases[0]
}

// isProduction, isStaging, otherwise last created
export const getHighestBundle = (bundles: BundleModel[]): BundleModel | null => {
  if (!bundles.length) return null

  const selectedBundle =
    bundles.find((bundle) => bundle.isProduction) ||
    bundles.find((bundle) => bundle.isStaging) ||
    bundles[0] ||
    null

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

// gets all server addons from the bundle and installed addons
const getBundleServerAddons = (bundle?: BundleModel | null, addons: AddonListItem[] = []) => {
  // get only server addons
  const serverAddons = addons.filter((addon) => addon.addonType === 'server')
  // filter bundle addons that are server addons
  const serverBundleAddons: Record<string, string> = {}
  for (const [name, version] of Object.entries(bundle?.addons || {})) {
    // check if the bundle addon is a server addon
    if (serverAddons.some((addon) => addon.name === name)) {
      // if it is, add it to the serverBundleAddons
      serverBundleAddons[name] = version
    }
  }

  console.log('Found server addons:', serverBundleAddons)

  return serverBundleAddons
}

export const createBundleFromRelease = (
  release: GetReleaseInfoApiResponse,
  selectedAddons: string[],
  selectedPlatforms: string[],
  bundleList: BundleModel[],
  addonsList: AddonListItem[],
) => {
  const { installers = [], dependencyPackages = [] } = release

  const bundleAddons: {
    [name: string]: string
  } = {}
  for (const name of selectedAddons) {
    // find addon in release
    const addon = release?.addons?.find((addon) => addon?.name === name)
    if (addon && addon.version) {
      bundleAddons[name] = addon.version
    }
  }

  const installerVersion = installers[0]?.version
  const bundleDepPackages: { [platform: string]: string } = {}
  for (const depPackage of dependencyPackages) {
    // skip if platform is not selected
    if (!selectedPlatforms.includes(depPackage.platform)) continue
    bundleDepPackages[depPackage.platform] = depPackage.filename
  }

  const name = getNewBundleName(release.release, bundleList)

  // get prod bundle, then staging bundle, then latest bundle
  const bundle = getHighestBundle(bundleList)
  const hasProduction = bundle?.isProduction || false

  // finds all server addons in the current bundle so that they can be transferred over to the new bundle
  const serverAddons = getBundleServerAddons(bundle, addonsList)
  // add server addons to the bundle addons
  for (const [name, version] of Object.entries(serverAddons)) {
    bundleAddons[name] = version
  }

  return {
    name,
    addons: bundleAddons,
    installerVersion,
    dependencyPackages: bundleDepPackages,
    isProduction: !hasProduction,
  }
}

export const areAddonsOnlyMandatory = (
  addons: string[],
  mandatoryAddons: string[] = [],
  releaseAddons: string[] = [],
) => {
  const filteredAddons = addons.filter((addon) => releaseAddons.includes(addon))
  return filteredAddons.every((addon) => mandatoryAddons.includes(addon))
}
