import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    marketAddonList: build.query<MarketAddonListApiResponse, MarketAddonListApiArg>({
      query: () => ({ url: `/api/market/addons` }),
    }),
    marketAddonDetail: build.query<MarketAddonDetailApiResponse, MarketAddonDetailApiArg>({
      query: (queryArg) => ({ url: `/api/market/addons/${queryArg.addonName}` }),
    }),
    marketAddonVersionDetail: build.query<
      MarketAddonVersionDetailApiResponse,
      MarketAddonVersionDetailApiArg
    >({
      query: (queryArg) => ({
        url: `/api/market/addons/${queryArg.addonName}/${queryArg.addonVersion}`,
      }),
    }),
    getLicenses: build.query<GetLicensesApiResponse, GetLicensesApiArg>({
      query: (queryArg) => ({
        url: `/api/market/licenses`,
        params: {
          refresh: queryArg.refresh,
        },
      }),
    }),
    getReleases: build.query<GetReleasesApiResponse, GetReleasesApiArg>({
      query: (queryArg) => ({
        url: `/api/market/releases`,
        params: {
          all: queryArg.all,
        },
      }),
    }),
    getReleaseInfo: build.query<GetReleaseInfoApiResponse, GetReleaseInfoApiArg>({
      query: (queryArg) => ({ url: `/api/market/releases/${queryArg.releaseName}` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type MarketAddonListApiResponse = /** status 200 Successful Response */ AddonList
export type MarketAddonListApiArg = void
export type MarketAddonDetailApiResponse = /** status 200 Successful Response */ AddonDetail
export type MarketAddonDetailApiArg = {
  addonName: string
}
export type MarketAddonVersionDetailApiResponse =
  /** status 200 Successful Response */ AddonVersionDetail
export type MarketAddonVersionDetailApiArg = {
  addonName: string
  addonVersion: string
}
export type GetLicensesApiResponse = /** status 200 Successful Response */ LicenseListModel
export type GetLicensesApiArg = {
  refresh?: boolean
}
export type GetReleasesApiResponse = /** status 200 Successful Response */ ReleaseListModel
export type GetReleasesApiArg = {
  all?: boolean
}
export type GetReleaseInfoApiResponse = /** status 200 Successful Response */ ReleaseInfoModel
export type GetReleaseInfoApiArg = {
  releaseName: string
}
export type LinkModel = {
  type?: 'homepage' | 'github' | 'documentation' | 'license'
  label?: string
  url: string
}
export type AddonListItem = {
  name: string
  title: string
  /** Addon description */
  description?: string
  orgName?: string
  orgTitle?: string
  icon?: string
  tags?: string[]
  flags?: string[]
  /** Latest version of the addon */
  latestVersion?: string
  /** Links to the addon's homepage and GitHub repository */
  links?: LinkModel[]
  /** Addon is avaliable for download */
  available?: boolean
  currentProductionVersion?: string
  currentLatestVersion?: string
  isOutdated?: boolean
}
export type AddonList = {
  addons?: AddonListItem[]
}
export type AddonVersionListItem = {
  version: string
  /** Required Ayon server version to run the addon */
  ayonVersion?: string
  createdAt?: string
  updatedAt?: string
  /** Is this version compatible? */
  isCompatible?: boolean
  /** Is this version installed? */
  isInstalled?: boolean
  /** Is this version in production? */
  isProduction?: boolean
}
export type AddonDetail = {
  name: string
  title: string
  /** Addon description */
  description?: string
  orgName?: string
  orgTitle?: string
  icon?: string
  tags?: string[]
  flags?: string[]
  /** Latest version of the addon */
  latestVersion?: string
  /** Links to the addon's homepage and GitHub repository */
  links?: LinkModel[]
  /** Addon is avaliable for download */
  available?: boolean
  currentProductionVersion?: string
  currentLatestVersion?: string
  isOutdated?: boolean
  /** A list of versions of this addon */
  versions?: AddonVersionListItem[]
  /** A warning message to display to the user */
  warning?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type AddonVersionDetail = {
  name: string
  title: string
  /** Addon description */
  description?: string
  orgName?: string
  orgTitle?: string
  icon?: string
  tags?: string[]
  flags?: string[]
  /** Latest version of the addon */
  latestVersion?: string
  /** Links to the addon's homepage and GitHub repository */
  links?: LinkModel[]
  /** Addon is avaliable for download */
  available?: boolean
  currentProductionVersion?: string
  currentLatestVersion?: string
  isOutdated?: boolean
  version: string
  url?: string
  altUrl?: string
  checksum?: string
  /** The version of Ayon this version is compatible with */
  ayonVersion?: string
  /** When this version was created */
  createdAt?: string
  /** When this version was last updated */
  updatedAt?: string
  /** Is this version installed? */
  isInstalled?: boolean
  /** Is this version in production? */
  isProduction?: boolean
  /** Is this version compatible? */
  isCompatible?: boolean
}
export type LicenseListModel = {
  licenses?: object[]
  syncedAt?: number
}
export type ReleaseListItemModel = {
  name: string
  label: string
  release: string
  description?: string
  icon?: string
  createdAt: string
  mandatoryAddons?: string[]
  isLatest: boolean
  addons: string[]
}
export type ReleaseListModel = {
  releases: ReleaseListItemModel[]
  detail?: string
}
export type SourceModel = {
  /** If set to server, the file is stored on the server. If set to http, the file is downloaded from the specified URL. */
  type: 'server' | 'http'
  /** URL to download the file from. Only used if type is url */
  url?: string
}
export type InstallerManifest = {
  filename: string
  platform: 'windows' | 'linux' | 'darwin'
  size?: number
  checksum?: string
  checksumAlgorithm?: 'md5' | 'sha1' | 'sha256'
  /** List of sources to download the file from. Server source is added automatically by the server if the file is uploaded. */
  sources?: SourceModel[]
  /** Version of the installer */
  version: string
  /** Version of Python that the installer is created with */
  pythonVersion: string
  /** mapping of module name:version used to create the installer */
  pythonModules?: {
    [key: string]:
      | string
      | {
          [key: string]: string
        }
  }
  /** mapping of module_name:module_version used to run the installer */
  runtimePythonModules?: {
    [key: string]: string
  }
}
export type DependencyPackageManifest = {
  filename: string
  platform: 'windows' | 'linux' | 'darwin'
  size?: number
  checksum?: string
  checksumAlgorithm?: 'md5' | 'sha1' | 'sha256'
  /** List of sources to download the file from. Server source is added automatically by the server if the file is uploaded. */
  sources?: SourceModel[]
  /** Version of the Ayon installer this package is created with */
  installerVersion: string
  /** mapping of addon_name:addon_version used to create the package */
  sourceAddons?: {
    [key: string]: string
  }
  /** mapping of module_name:module_version used to create the package */
  pythonModules?: {
    [key: string]:
      | string
      | {
          [key: string]: string
        }
  }
}
export type ReleaseInfoModel = {
  name: string
  label: string
  release: string
  description?: string
  icon?: string
  createdAt: string
  mandatoryAddons?: string[]
  addons?: AddonVersionDetail[]
  installers?: InstallerManifest[]
  dependencyPackages?: DependencyPackageManifest[]
}
