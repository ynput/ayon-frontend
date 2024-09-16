import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReleases: build.query<GetReleasesApiResponse, GetReleasesApiArg>({
      query: () => ({ url: `/api/onboarding/releases` }),
    }),
    getReleaseInfo: build.query<GetReleaseInfoApiResponse, GetReleaseInfoApiArg>({
      query: (queryArg) => ({ url: `/api/onboarding/releases/${queryArg.releaseName}` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetReleasesApiResponse = /** status 200 Successful Response */ ReleaseListModel
export type GetReleasesApiArg = void
export type GetReleaseInfoApiResponse = /** status 200 Successful Response */ ReleaseInfoModel
export type GetReleaseInfoApiArg = {
  releaseName: string
}
export type ReleaseListItemModel = {
  name: string
  label: string
  bio?: string
  icon?: string
  createdAt: string
  isLatest: boolean
  addons: string[]
  mandatoryAddons?: string[]
}
export type ReleaseListModel = {
  releases: ReleaseListItemModel[]
}
export type ReleaseAddon = {
  name: string
  title?: string
  description?: string
  icon?: string
  preview?: string
  features?: string[]
  families?: string[]
  tags?: string[]
  docs?: {
    [key: string]: string
  }
  github?: string
  discussion?: string
  isFree?: boolean
  version?: string
  url?: string
  /** Checksum of the zip file */
  checksum?: string
  mandatory?: boolean
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
  createdAt?: string
  addons?: ReleaseAddon[]
  installers?: InstallerManifest[]
  dependencyPackages?: DependencyPackageManifest[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
