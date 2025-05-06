import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listDependencyPackages: build.query<
      ListDependencyPackagesApiResponse,
      ListDependencyPackagesApiArg
    >({
      query: () => ({ url: `/api/desktop/dependencyPackages` }),
    }),
    createDependencyPackage: build.mutation<
      CreateDependencyPackageApiResponse,
      CreateDependencyPackageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/desktop/dependencyPackages`,
        method: 'POST',
        body: queryArg.dependencyPackage,
        params: {
          url: queryArg.url,
          overwrite: queryArg.overwrite,
          force: queryArg.force,
        },
      }),
    }),
    downloadDependencyPackage: build.query<
      DownloadDependencyPackageApiResponse,
      DownloadDependencyPackageApiArg
    >({
      query: (queryArg) => ({ url: `/api/desktop/dependencyPackages/${queryArg.filename}` }),
    }),
    uploadDependencyPackage: build.mutation<
      UploadDependencyPackageApiResponse,
      UploadDependencyPackageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/desktop/dependencyPackages/${queryArg.filename}`,
        method: 'PUT',
      }),
    }),
    deleteDependencyPackage: build.mutation<
      DeleteDependencyPackageApiResponse,
      DeleteDependencyPackageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/desktop/dependencyPackages/${queryArg.filename}`,
        method: 'DELETE',
      }),
    }),
    updateDependencyPackage: build.mutation<
      UpdateDependencyPackageApiResponse,
      UpdateDependencyPackageApiArg
    >({
      query: (queryArg) => ({
        url: `/api/desktop/dependencyPackages/${queryArg.filename}`,
        method: 'PATCH',
        body: queryArg.sourcesPatchModel,
      }),
    }),
    listInstallers: build.query<ListInstallersApiResponse, ListInstallersApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers`,
        params: {
          version: queryArg.version,
          platform: queryArg.platform,
          variant: queryArg.variant,
        },
      }),
    }),
    createInstaller: build.mutation<CreateInstallerApiResponse, CreateInstallerApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers`,
        method: 'POST',
        body: queryArg.installer,
        params: {
          url: queryArg.url,
          overwrite: queryArg.overwrite,
          force: queryArg.force,
        },
      }),
    }),
    downloadInstallerFile: build.query<
      DownloadInstallerFileApiResponse,
      DownloadInstallerFileApiArg
    >({
      query: (queryArg) => ({ url: `/api/desktop/installers/${queryArg.filename}` }),
    }),
    uploadInstallerFile: build.mutation<UploadInstallerFileApiResponse, UploadInstallerFileApiArg>({
      query: (queryArg) => ({ url: `/api/desktop/installers/${queryArg.filename}`, method: 'PUT' }),
    }),
    deleteInstallerFile: build.mutation<DeleteInstallerFileApiResponse, DeleteInstallerFileApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers/${queryArg.filename}`,
        method: 'DELETE',
      }),
    }),
    patchInstaller: build.mutation<PatchInstallerApiResponse, PatchInstallerApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers/${queryArg.filename}`,
        method: 'PATCH',
        body: queryArg.sourcesPatchModel,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListDependencyPackagesApiResponse =
  /** status 200 Successful Response */ DependencyPackageList
export type ListDependencyPackagesApiArg = void
export type CreateDependencyPackageApiResponse =
  /** status 201 Successful Response */ InstallResponseModel
export type CreateDependencyPackageApiArg = {
  /** URL to the addon zip file */
  url?: string
  /** Deprecated. Use the force. */
  overwrite?: boolean
  /** Force install the package if it already exists */
  force?: boolean
  dependencyPackage: DependencyPackage
}
export type DownloadDependencyPackageApiResponse = /** status 200 Successful Response */ any
export type DownloadDependencyPackageApiArg = {
  filename: string
}
export type UploadDependencyPackageApiResponse = unknown
export type UploadDependencyPackageApiArg = {
  filename: string
}
export type DeleteDependencyPackageApiResponse = unknown
export type DeleteDependencyPackageApiArg = {
  filename: string
}
export type UpdateDependencyPackageApiResponse = unknown
export type UpdateDependencyPackageApiArg = {
  filename: string
  sourcesPatchModel: SourcesPatchModel
}
export type ListInstallersApiResponse = /** status 200 Successful Response */ InstallerListModel
export type ListInstallersApiArg = {
  /** Version of the package */
  version?: string
  /** Platform of the package */
  platform?: 'windows' | 'linux' | 'darwin'
  variant?: 'production' | 'staging'
}
export type CreateInstallerApiResponse = /** status 201 Successful Response */ InstallResponseModel
export type CreateInstallerApiArg = {
  /** URL to the addon zip file */
  url?: string
  /** Deprecated. Use the force */
  overwrite?: boolean
  /** Overwrite existing installer */
  force?: boolean
  installer: Installer
}
export type DownloadInstallerFileApiResponse = /** status 200 Successful Response */ any
export type DownloadInstallerFileApiArg = {
  filename: string
}
export type UploadInstallerFileApiResponse = unknown
export type UploadInstallerFileApiArg = {
  filename: string
}
export type DeleteInstallerFileApiResponse = unknown
export type DeleteInstallerFileApiArg = {
  filename: string
}
export type PatchInstallerApiResponse = unknown
export type PatchInstallerApiArg = {
  filename: string
  sourcesPatchModel: SourcesPatchModel
}
export type SourceModel = {
  /** If set to server, the file is stored on the server. If set to http, the file is downloaded from the specified URL. */
  type: 'server' | 'http'
  /** URL to download the file from. Only used if type is url */
  url?: string
}
export type DependencyPackage = {
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
export type DependencyPackageList = {
  packages?: DependencyPackage[]
}
export type InstallResponseModel = {
  eventId?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type SourcesPatchModel = {
  /** List of sources to download the file from. Server source is added automatically by the server if the file is uploaded. */
  sources?: SourceModel[]
}
export type Installer = {
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
export type InstallerListModel = {
  installers?: Installer[]
}
