import type { BundleModel, DependencyPackage, Installer } from '@shared/api'
import { useListBundlesQuery } from '@queries/bundles/getBundles'
import { useListDependencyPackagesQuery } from '@queries/dependencyPackages/getDependencyPackages'
import { useListInstallersQuery } from '@queries/installers/getInstallers'

export type UploadedFile = {
  filename: string
  version: string
  platform: 'windows' | 'linux' | 'darwin'
  size?: number
  statuses: string[]
}

const addStatus = (statuses: string[], status: string, condition?: boolean) => {
  if (condition && !statuses.includes(status)) {
    statuses.push(status)
  }
}

const resolveInstallersStatuses = (version: string, bundles: BundleModel[]): string[] => {
  const bundlesWithInstaller = bundles.filter((bundle) => bundle.installerVersion === version)

  const statuses: string[] = []

  for (const bundle of bundlesWithInstaller) {
    addStatus(statuses, 'production', bundle.isProduction)
    addStatus(statuses, 'staging', bundle.isStaging)
    addStatus(statuses, 'dev', bundle.isDev)
  }

  return statuses
}

const transformInstallers = (installers: Installer[], bundles: BundleModel[]): UploadedFile[] => {
  return installers.map((installer) => ({
    filename: installer.filename,
    version: installer.version,
    platform: installer.platform,
    size: installer.size,
    statuses: resolveInstallersStatuses(installer.version, bundles),
  }))
}

// find all bundles that have the filename in a bundle depPackages and isProduction, isStaging, isDev
// return 'production', 'staging', 'dev' or empty list
const resolvePackagesStatuses = (filename: string, bundles: BundleModel[]): string[] => {
  const bundlesWithPackage = bundles.filter((bundle) => {
    return Object.values(bundle.dependencyPackages || {}).includes(filename)
  })

  const statuses: string[] = []

  for (const bundle of bundlesWithPackage) {
    addStatus(statuses, 'production', bundle.isProduction)
    addStatus(statuses, 'staging', bundle.isStaging)
    addStatus(statuses, 'dev', bundle.isDev)
  }

  return statuses
}

const transformPackages = (
  packages: DependencyPackage[],
  bundles: BundleModel[],
): UploadedFile[] => {
  return packages.map((p) => ({
    filename: p.filename,
    version: p.installerVersion,
    platform: p.platform,
    size: p.size,
    statuses: resolvePackagesStatuses(p.filename, bundles),
  }))
}

const useFetchManagerData = (manager: string): UploadedFile[] => {
  const { data: { installers = [] } = {} } = useListInstallersQuery({})
  const { data: { packages = [] } = {} } = useListDependencyPackagesQuery()
  const { data: { bundles = [] } = {} } = useListBundlesQuery({})

  const data =
    manager === 'installer'
      ? transformInstallers(installers, bundles)
      : transformPackages(packages, bundles)

  return data
}

export default useFetchManagerData
