import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listBundles: build.query<ListBundlesApiResponse, ListBundlesApiArg>({
      query: (queryArg) => ({ url: `/api/bundles`, params: { archived: queryArg.archived } }),
    }),
    checkBundleCompatibility: build.query<
      CheckBundleCompatibilityApiResponse,
      CheckBundleCompatibilityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/bundles/check`,
        method: 'POST',
        body: queryArg.bundleModel,
      }),
    }),
    migrateSettingsByBundle: build.mutation<
      MigrateSettingsByBundleApiResponse,
      MigrateSettingsByBundleApiArg
    >({
      query: (queryArg) => ({
        url: `/api/migrateSettingsByBundle`,
        method: 'POST',
        body: queryArg.migrateBundleSettingsRequest,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListBundlesApiResponse = /** status 200 Successful Response */ ListBundleModel
export type ListBundlesApiArg = {
  /** Include archived bundles */
  archived?: boolean
}
export type CheckBundleCompatibilityApiResponse =
  /** status 200 Successful Response */ CheckBundleResponseModel
export type CheckBundleCompatibilityApiArg = {
  bundleModel: BundleModel
}
export type MigrateSettingsByBundleApiResponse = /** status 200 Successful Response */ any
export type MigrateSettingsByBundleApiArg = {
  migrateBundleSettingsRequest: MigrateBundleSettingsRequest
}
export type AddonDevelopmentItem = {
  /** Enable/disable addon development */
  enabled?: boolean
  /** Path to addon directory */
  path?: string
}
export type BundleModel = {
  /** Name of the bundle */
  name: string
  createdAt?: string
  addons?: {
    [key: string]: string
  }
  installerVersion?: string
  /** mapping of platform:dependency_package_filename */
  dependencyPackages?: {
    [key: string]: string
  }
  addonDevelopment?: {
    [key: string]: AddonDevelopmentItem
  }
  isProduction?: boolean
  isStaging?: boolean
  isArchived?: boolean
  isDev?: boolean
  activeUser?: string
}
export type ListBundleModel = {
  bundles?: BundleModel[]
  productionBundle?: string
  stagingBundle?: string
  devBundles?: string[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type BundleIssueModel = {
  severity: 'error' | 'warning'
  addon?: string
  message: string
  requiredAddon?: string
}
export type CheckBundleResponseModel = {
  success?: boolean
  issues?: BundleIssueModel[]
}
export type MigrateBundleSettingsRequest = {
  /** Source bundle */
  sourceBundle: string
  /** Target bundle */
  targetBundle: string
  /** Source variant */
  sourceVariant: string
  /** Target variant */
  targetVariant: string
  /** Migrate project settings */
  withProjects?: boolean
}
