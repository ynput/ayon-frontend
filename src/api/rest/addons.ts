import { BaseAPI as api } from '@shared/api'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listAddons: build.query<ListAddonsApiResponse, ListAddonsApiArg>({
      query: (queryArg) => ({
        url: `/api/addons`,
        params: {
          details: queryArg.details,
        },
      }),
    }),
    deleteAddonVersion: build.mutation<DeleteAddonVersionApiResponse, DeleteAddonVersionApiArg>({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}`,
        method: 'DELETE',
        params: {
          purge: queryArg.purge,
        },
      }),
    }),
    uploadAddonZipFile: build.mutation<UploadAddonZipFileApiResponse, UploadAddonZipFileApiArg>({
      query: (queryArg) => ({
        url: `/api/addons/install`,
        method: 'POST',
        params: {
          url: queryArg.url,
          addonName: queryArg.addonName,
          addonVersion: queryArg.addonVersion,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListAddonsApiResponse = /** status 200 Successful Response */ AddonList
export type ListAddonsApiArg = {
  details?: boolean
}
export type DeleteAddonVersionApiResponse = /** status 200 Successful Response */ any
export type DeleteAddonVersionApiArg = {
  addonName: string
  addonVersion: string
  purge?: boolean
}
export type UploadAddonZipFileApiResponse =
  /** status 200 Successful Response */ InstallAddonResponseModel
export type UploadAddonZipFileApiArg = {
  url?: string
  addonName?: string
  addonVersion?: string
}
export type PathDefinition = {
  windows?: string
  linux?: string
  darwin?: string
}
export type FilesystemSourceInfo = {
  type?: 'filesystem'
  path?: PathDefinition
}
export type ServerSourceInfo = {
  type?: 'server'
  filename?: string
  path?: string
}
export type HttpSourceInfo = {
  type?: 'http'
  url: string
  filename?: string
  headers?: {
    [key: string]: string
  }
}
export type VersionInfo = {
  hasSettings?: boolean
  hasSiteSettings?: boolean
  frontendScopes?: object
  clientPyproject?: object
  clientSourceInfo?: (FilesystemSourceInfo | ServerSourceInfo | HttpSourceInfo)[]
  services?: object
  isBroken?: boolean
  reason?: {
    [key: string]: string
  }
  projectCanOverrideAddonVersion?: boolean
}
export type AddonListItem = {
  /** Machine friendly name of the addon */
  name: string
  /** Human friendly title of the addon */
  title: string
  /** List of available versions */
  versions: {
    [key: string]: VersionInfo
  }
  /** Addon description */
  description: string
  /** Production version of the addon */
  productionVersion?: string
  /** Staging version of the addon */
  stagingVersion?: string
  /** Type of the addon */
  addonType: 'server' | 'pipeline'
  /** Is the addon a system addon? */
  system?: boolean
  /** Allow project override */
  projectCanOverrideAddonVersion?: boolean
}
export type AddonList = {
  /** List of available addons */
  addons: AddonListItem[]
}
export type ErrorResponse = {
  code: number
  detail: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type InstallAddonResponseModel = {
  eventId: string
}
