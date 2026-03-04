import { api } from '@shared/api/base'
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
    configureAddons: build.mutation<ConfigureAddonsApiResponse, ConfigureAddonsApiArg>({
      query: (queryArg) => ({
        url: `/api/addons`,
        method: 'POST',
        body: queryArg.addonConfigRequest,
      }),
    }),
    deleteAddon: build.mutation<DeleteAddonApiResponse, DeleteAddonApiArg>({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}`,
        method: 'DELETE',
        params: {
          purge: queryArg.purge,
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
    getInstalledAddonsList: build.query<
      GetInstalledAddonsListApiResponse,
      GetInstalledAddonsListApiArg
    >({
      query: () => ({ url: `/api/addons/install` }),
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
    getAddonProjectSettingsSchema: build.query<
      GetAddonProjectSettingsSchemaApiResponse,
      GetAddonProjectSettingsSchemaApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/schema/${queryArg.projectName}`,
        params: {
          variant: queryArg.variant,
          site_id: queryArg.siteId,
        },
      }),
    }),
    getAddonProjectSettings: build.query<
      GetAddonProjectSettingsApiResponse,
      GetAddonProjectSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/settings/${queryArg.projectName}`,
        params: {
          variant: queryArg.variant,
          as: queryArg['as'],
          site_id: queryArg.siteId,
        },
      }),
    }),
    setAddonProjectSettings: build.mutation<
      SetAddonProjectSettingsApiResponse,
      SetAddonProjectSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/settings/${queryArg.projectName}`,
        method: 'POST',
        body: queryArg.payload,
        params: {
          variant: queryArg.variant,
          site_id: queryArg.siteId,
        },
      }),
    }),
    getAddonProjectOverrides: build.query<
      GetAddonProjectOverridesApiResponse,
      GetAddonProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/overrides/${queryArg.projectName}`,
        params: {
          variant: queryArg.variant,
          as: queryArg['as'],
          site_id: queryArg.siteId,
        },
      }),
    }),
    modifyProjectOverrides: build.mutation<
      ModifyProjectOverridesApiResponse,
      ModifyProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/overrides/${queryArg.projectName}`,
        method: 'POST',
        body: queryArg.modifyOverridesRequestModel,
        params: {
          variant: queryArg.variant,
          site_id: queryArg.siteId,
        },
      }),
    }),
    deleteAddonProjectOverrides: build.mutation<
      DeleteAddonProjectOverridesApiResponse,
      DeleteAddonProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/overrides/${queryArg.projectName}`,
        method: 'DELETE',
        params: {
          variant: queryArg.variant,
          site_id: queryArg.siteId,
        },
      }),
    }),
    getRawAddonProjectOverrides: build.query<
      GetRawAddonProjectOverridesApiResponse,
      GetRawAddonProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/rawOverrides/${queryArg.projectName}`,
        params: {
          variant: queryArg.variant,
          site_id: queryArg.siteId,
        },
      }),
    }),
    setRawAddonProjectOverrides: build.mutation<
      SetRawAddonProjectOverridesApiResponse,
      SetRawAddonProjectOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/rawOverrides/${queryArg.projectName}`,
        method: 'PUT',
        body: queryArg.payload,
        params: {
          variant: queryArg.variant,
          site_id: queryArg.siteId,
        },
      }),
    }),
    getAddonSiteSettingsSchema: build.query<
      GetAddonSiteSettingsSchemaApiResponse,
      GetAddonSiteSettingsSchemaApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/siteSettings/schema`,
      }),
    }),
    getAddonSiteSettings: build.query<GetAddonSiteSettingsApiResponse, GetAddonSiteSettingsApiArg>({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/siteSettings`,
        params: {
          site_id: queryArg.siteId,
        },
      }),
    }),
    setAddonSiteSettings: build.mutation<
      SetAddonSiteSettingsApiResponse,
      SetAddonSiteSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.version}/siteSettings`,
        method: 'PUT',
        body: queryArg.payload,
        params: {
          site_id: queryArg.siteId,
        },
      }),
    }),
    getAddonSettingsSchema: build.query<
      GetAddonSettingsSchemaApiResponse,
      GetAddonSettingsSchemaApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/schema`,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    getAddonStudioSettings: build.query<
      GetAddonStudioSettingsApiResponse,
      GetAddonStudioSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/settings`,
        params: {
          variant: queryArg.variant,
          as: queryArg['as'],
        },
      }),
    }),
    setAddonStudioSettings: build.mutation<
      SetAddonStudioSettingsApiResponse,
      SetAddonStudioSettingsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/settings`,
        method: 'POST',
        body: queryArg.payload,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    getAddonStudioOverrides: build.query<
      GetAddonStudioOverridesApiResponse,
      GetAddonStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/overrides`,
        params: {
          variant: queryArg.variant,
          as: queryArg['as'],
        },
      }),
    }),
    modifyStudioOverrides: build.mutation<
      ModifyStudioOverridesApiResponse,
      ModifyStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/overrides`,
        method: 'POST',
        body: queryArg.modifyOverridesRequestModel,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    deleteAddonStudioOverrides: build.mutation<
      DeleteAddonStudioOverridesApiResponse,
      DeleteAddonStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/overrides`,
        method: 'DELETE',
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    getRawAddonStudioOverrides: build.query<
      GetRawAddonStudioOverridesApiResponse,
      GetRawAddonStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/rawOverrides`,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    setRawAddonStudioOverrides: build.mutation<
      SetRawAddonStudioOverridesApiResponse,
      SetRawAddonStudioOverridesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/${queryArg.addonName}/${queryArg.addonVersion}/rawOverrides`,
        method: 'PUT',
        body: queryArg.payload,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    getAllAddonsSettings: build.query<GetAllAddonsSettingsApiResponse, GetAllAddonsSettingsApiArg>({
      query: (queryArg) => ({
        url: `/api/settings/addons`,
        params: {
          variant: queryArg.variant,
          project: queryArg.project,
          site: queryArg.site,
        },
      }),
    }),
    getAllSiteSettings: build.query<GetAllSiteSettingsApiResponse, GetAllSiteSettingsApiArg>({
      query: (queryArg) => ({
        url: `/api/settings/addons/siteSettings`,
        params: {
          variant: queryArg.variant,
          site: queryArg.site,
        },
      }),
    }),
    getAllSettings: build.query<GetAllSettingsApiResponse, GetAllSettingsApiArg>({
      query: (queryArg) => ({
        url: `/api/settings`,
        params: {
          bundle_name: queryArg.bundleName,
          project_name: queryArg.projectName,
          project_bundle_name: queryArg.projectBundleName,
          variant: queryArg.variant,
          summary: queryArg.summary,
          site_id: queryArg.siteId,
          limit: queryArg.limit,
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
export type ConfigureAddonsApiResponse = /** status 200 Successful Response */ any
export type ConfigureAddonsApiArg = {
  addonConfigRequest: AddonConfigRequest
}
export type DeleteAddonApiResponse = /** status 200 Successful Response */ any
export type DeleteAddonApiArg = {
  addonName: string
  purge?: boolean
}
export type DeleteAddonVersionApiResponse = /** status 200 Successful Response */ any
export type DeleteAddonVersionApiArg = {
  addonName: string
  addonVersion: string
  purge?: boolean
}
export type GetInstalledAddonsListApiResponse =
  /** status 200 Successful Response */ AddonInstallListResponseModel
export type GetInstalledAddonsListApiArg = void
export type UploadAddonZipFileApiResponse =
  /** status 200 Successful Response */ InstallAddonResponseModel
export type UploadAddonZipFileApiArg = {
  url?: string
  addonName?: string
  addonVersion?: string
}
export type GetAddonProjectSettingsSchemaApiResponse = /** status 200 Successful Response */ object
export type GetAddonProjectSettingsSchemaApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type GetAddonProjectSettingsApiResponse = /** status 200 Successful Response */ object
export type GetAddonProjectSettingsApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  as?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type SetAddonProjectSettingsApiResponse = unknown
export type SetAddonProjectSettingsApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  payload: object
}
export type GetAddonProjectOverridesApiResponse = /** status 200 Successful Response */ any
export type GetAddonProjectOverridesApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  as?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type ModifyProjectOverridesApiResponse = unknown
export type ModifyProjectOverridesApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  modifyOverridesRequestModel: ModifyOverridesRequestModel
}
export type DeleteAddonProjectOverridesApiResponse = unknown
export type DeleteAddonProjectOverridesApiArg = {
  addonName: string
  version: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type GetRawAddonProjectOverridesApiResponse = /** status 200 Successful Response */ object
export type GetRawAddonProjectOverridesApiArg = {
  addonName: string
  addonVersion: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type SetRawAddonProjectOverridesApiResponse = unknown
export type SetRawAddonProjectOverridesApiArg = {
  addonName: string
  addonVersion: string
  projectName: string
  variant?: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  payload: object
}
export type GetAddonSiteSettingsSchemaApiResponse = /** status 200 Successful Response */ object
export type GetAddonSiteSettingsSchemaApiArg = {
  addonName: string
  version: string
}
export type GetAddonSiteSettingsApiResponse = /** status 200 Successful Response */ object
export type GetAddonSiteSettingsApiArg = {
  addonName: string
  version: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
}
export type SetAddonSiteSettingsApiResponse = unknown
export type SetAddonSiteSettingsApiArg = {
  addonName: string
  version: string
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  payload: object
}
export type GetAddonSettingsSchemaApiResponse = /** status 200 Successful Response */ object
export type GetAddonSettingsSchemaApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
}
export type GetAddonStudioSettingsApiResponse = /** status 200 Successful Response */ object
export type GetAddonStudioSettingsApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  as?: string
}
export type SetAddonStudioSettingsApiResponse = unknown
export type SetAddonStudioSettingsApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  payload: object
}
export type GetAddonStudioOverridesApiResponse = /** status 200 Successful Response */ any
export type GetAddonStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  as?: string
}
export type ModifyStudioOverridesApiResponse = unknown
export type ModifyStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  modifyOverridesRequestModel: ModifyOverridesRequestModel
}
export type DeleteAddonStudioOverridesApiResponse = unknown
export type DeleteAddonStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
}
export type GetRawAddonStudioOverridesApiResponse = /** status 200 Successful Response */ object
export type GetRawAddonStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
}
export type SetRawAddonStudioOverridesApiResponse = unknown
export type SetRawAddonStudioOverridesApiArg = {
  addonName: string
  addonVersion: string
  variant?: string
  payload: object
}
export type GetAllAddonsSettingsApiResponse =
  /** status 200 Successful Response */ AddonSettingsResponse
export type GetAllAddonsSettingsApiArg = {
  variant?: 'production' | 'staging'
  project?: string
  site?: string
}
export type GetAllSiteSettingsApiResponse =
  /** status 200 Successful Response */ AddonSettingsResponse
export type GetAllSiteSettingsApiArg = {
  variant?: 'production' | 'staging'
  site?: string
}
export type GetAllSettingsApiResponse =
  /** status 200 Successful Response */ AllSettingsResponseModel
export type GetAllSettingsApiArg = {
  /** Use explicit bundle name to get the addon list. Current production (or staging) will be used if not set */
  bundleName?: string
  /** Return project settings for the given project name. Studio settings will be returned if not set */
  projectName?: string
  /** Use explicit project bundle instead of the default one to resolve the project addons. */
  projectBundleName?: string
  /** Variant of the settings to return. This field is also used to determine which bundle to useif bundle_name or project_bundle_name is not set */
  variant?: string
  /** Summary mode. When selected, do not return actual settings instead only return the basic information about the addons in the specified bundles */
  summary?: boolean
  /** Site ID may be specified a query parameter. Both `site_id` and its's alias `site` are supported. */
  siteId?: string
  limit?: number
}
export type FrontendScopeSettings = {
  admin?: boolean
  manager?: boolean
  sidebar?: string
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
  frontendScopes?: {
    [key: string]: FrontendScopeSettings
  }
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
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type VariantCopyRequest = {
  /** Addon name */
  addonName: string
  /** Source variant */
  copyFrom: 'production' | 'staging'
  /** Destination variant */
  copyTo: 'production' | 'staging'
}
export type AddonConfigRequest = {
  copyVariant?: VariantCopyRequest
}
export type AddonInstallListItemModel = {
  id: string
  topic: 'addon.install' | 'addon.install_from_url'
  description: string
  addonName?: string
  addonVersion?: string
  user?: string
  status: string
  createdAt: string
  updatedAt?: string
}
export type AddonInstallListResponseModel = {
  items: AddonInstallListItemModel[]
  restartRequired: boolean
}
export type InstallAddonResponseModel = {
  eventId: string
}
export type ModifyOverridesRequestModel = {
  action: 'delete' | 'pin'
  path: string[]
}
export type AddonSettingsResponse = {
  /** Addon settings for each active addon */
  settings: {
    [key: string]: object
  }
  /** Active versions of the addon for the given variant */
  versions: {
    [key: string]: string
  }
}
export type AddonSettingsItemModel = {
  name: string
  version: string
  title: string
  /** Indicates if the addon has editable settings */
  hasSettings?: boolean
  /** Indicates if the addon has editable project settings */
  hasProjectSettings?: boolean
  /** Indicates if the addon has editable project site settings */
  hasProjectSiteSettings?: boolean
  /** Indicates if the addon has editable site settings */
  hasSiteSettings?: boolean
  hasStudioOverrides?: boolean
  hasProjectOverrides?: boolean
  hasProjectSiteOverrides?: boolean
  /** Final settings for the addon depending of the studio/project/site branch */
  settings?: object
  /** Site settings for the addon depending of the site branch */
  siteSettings?: object
  /** Indicates if the addon is not properly initialized */
  isBroken?: boolean
  /** Reason for addon being broken */
  reason?: {
    [key: string]: string
  }
  /** Indicates if the addon is part of the project bundle */
  isProjectBundle?: boolean
}
export type AllSettingsResponseModel = {
  /** If specified, indicates that the settings are for a project */
  projectName?: string
  bundleName: string
  addons?: AddonSettingsItemModel[]
  /** If a project bundle is used, this field contains alist of addons that are inherited from the studio bundle */
  inheritedAddons?: string[]
}
