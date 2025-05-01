import { BaseAPI as api } from '@shared/api'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
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
        params: { url: queryArg.url, overwrite: queryArg.overwrite, force: queryArg.force },
      }),
    }),
    deleteInstallerFile: build.mutation<DeleteInstallerFileApiResponse, DeleteInstallerFileApiArg>({
      query: (queryArg) => ({
        url: `/api/desktop/installers/${queryArg.filename}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
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
export type DeleteInstallerFileApiResponse = /** status 204 Successful Response */ void
export type DeleteInstallerFileApiArg = {
  filename: string
}
export type SourceModel = {
  /** If set to server, the file is stored on the server. If set to http, the file is downloaded from the specified URL. */
  type: 'server' | 'http'
  /** URL to download the file from. Only used if type is url */
  url?: string
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
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type InstallResponseModel = {
  eventId?: string
}
