import { BundleModel } from '@api/rest/bundles'
import { ReleaseListItemModel } from '@api/rest/releases'
import { getPlatformLabel } from '@pages/AccountPage/DownloadsPage/DownloadsPage'

import { formatDistance } from 'date-fns'
import { ReleaseForm } from './hooks/useReleaseForm'

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

  const selectedBundle =
    bundles.find((bundle) => bundle.isProduction || bundle.isStaging || bundle.isDev) || bundles[0]

  return selectedBundle
}

export const resolveFormValidity = (form: ReleaseForm) => {
  const { addons, platforms } = form
  return addons.length > 0 && platforms.length > 0
}
