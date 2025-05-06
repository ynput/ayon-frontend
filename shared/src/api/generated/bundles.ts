import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listBundles: build.query<ListBundlesApiResponse, ListBundlesApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles`,
        params: {
          archived: queryArg.archived,
        },
      }),
    }),
    createNewBundle: build.mutation<CreateNewBundleApiResponse, CreateNewBundleApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles`,
        method: 'POST',
        body: queryArg.bundleModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
        params: {
          force: queryArg.force,
        },
      }),
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
    bundleActions: build.mutation<BundleActionsApiResponse, BundleActionsApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles/${queryArg.bundleName}`,
        method: 'POST',
        body: queryArg.bundleActionModel,
      }),
    }),
    deleteExistingBundle: build.mutation<
      DeleteExistingBundleApiResponse,
      DeleteExistingBundleApiArg
    >({
      query: (queryArg) => ({ url: `/api/bundles/${queryArg.bundleName}`, method: 'DELETE' }),
    }),
    updateBundle: build.mutation<UpdateBundleApiResponse, UpdateBundleApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles/${queryArg.bundleName}`,
        method: 'PATCH',
        body: queryArg.bundlePatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
        params: {
          build: queryArg.build,
          force: queryArg.force,
        },
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
export type CreateNewBundleApiResponse = /** status 201 Successful Response */ any
export type CreateNewBundleApiArg = {
  /** Force creation of bundle */
  force?: boolean
  'x-sender'?: string
  'x-sender-type'?: string
  bundleModel: BundleModel
}
export type CheckBundleCompatibilityApiResponse =
  /** status 200 Successful Response */ CheckBundleResponseModel
export type CheckBundleCompatibilityApiArg = {
  bundleModel: BundleModel
}
export type BundleActionsApiResponse = /** status 201 Successful Response */ any
export type BundleActionsApiArg = {
  bundleName: string
  bundleActionModel: BundleActionModel
}
export type DeleteExistingBundleApiResponse = unknown
export type DeleteExistingBundleApiArg = {
  bundleName: string
}
export type UpdateBundleApiResponse = unknown
export type UpdateBundleApiArg = {
  bundleName: string
  /** Build dependency packages for selected platforms */
  build?: ('windows' | 'linux' | 'darwin')[]
  /** Force creation of bundle */
  force?: boolean
  'x-sender'?: string
  'x-sender-type'?: string
  bundlePatchModel: BundlePatchModel
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
  isProject?: boolean
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
export type BundleActionModel = {
  action: 'promote'
}
export type BundlePatchModel = {
  addons?: {
    [key: string]: string
  }
  installerVersion?: string
  /** mapping of platform:dependency_package_filename */
  dependencyPackages?: {
    [key: string]: string
  }
  isProduction?: boolean
  isStaging?: boolean
  isArchived?: boolean
  isDev?: boolean
  activeUser?: string
  addonDevelopment?: {
    [key: string]: AddonDevelopmentItem
  }
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
