import { RestAPI as api } from '../../services/ayon'
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
        params: { url: queryArg.url, overwrite: queryArg.overwrite, force: queryArg.force },
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
export type DeleteDependencyPackageApiResponse = /** status 204 Successful Response */ void
export type DeleteDependencyPackageApiArg = {
  filename: string
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
