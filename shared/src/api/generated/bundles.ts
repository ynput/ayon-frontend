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
    updateBundle: build.mutation<UpdateBundleApiResponse, UpdateBundleApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles/${queryArg.bundleName}`,
        method: 'PATCH',
        body: queryArg.bundlePatchModel,
        params: {
          build: queryArg.build,
          force: queryArg.force,
        },
      }),
    }),
    deleteExistingBundle: build.mutation<
      DeleteExistingBundleApiResponse,
      DeleteExistingBundleApiArg
    >({
      query: (queryArg) => ({ url: `/api/bundles/${queryArg.bundleName}`, method: 'DELETE' }),
    }),
    bundleActions: build.mutation<BundleActionsApiResponse, BundleActionsApiArg>({
      query: (queryArg) => ({
        url: `/api/bundles/${queryArg.bundleName}`,
        method: 'POST',
        body: queryArg.bundleActionModel,
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
  bundleModel: BundleModel
}
export type CheckBundleCompatibilityApiResponse =
  /** status 200 Successful Response */ CheckBundleResponseModel
export type CheckBundleCompatibilityApiArg = {
  bundleModel: BundleModel
}
export type UpdateBundleApiResponse = unknown
export type UpdateBundleApiArg = {
  bundleName: string
  /** Build dependency packages for selected platforms */
  build?: ('windows' | 'linux' | 'darwin')[] | null
  /** Force creation of bundle */
  force?: boolean
  bundlePatchModel: BundlePatchModel
}
export type DeleteExistingBundleApiResponse = unknown
export type DeleteExistingBundleApiArg = {
  bundleName: string
}
export type BundleActionsApiResponse = /** status 201 Successful Response */ any
export type BundleActionsApiArg = {
  bundleName: string
  bundleActionModel: BundleActionModel
}
export type MigrateSettingsByBundleApiResponse = /** status 200 Successful Response */ any
export type MigrateSettingsByBundleApiArg = {
  migrateBundleSettingsRequest: MigrateBundleSettingsRequest
}
export type DependencyPackages = {
  [key: string]: string | null
}
export type AddonDevelopmentItem = {
  /** Enable/disable addon development */
  enabled?: boolean
  /** Path to addon directory */
  path?: string
}
export type BundleModel = {
  description?: string | null
  isProject?: boolean
  addons?: {
    [key: string]: string | null
  }
  installerVersion?: string | null
  dependencyPackages?: DependencyPackages
  addonDevelopment?: {
    [key: string]: AddonDevelopmentItem
  }
  /** Name of the bundle */
  name: string
  createdAt?: string
  updatedAt?: string
  isProduction?: boolean
  isStaging?: boolean
  isArchived?: boolean
  isDev?: boolean
  activeUser?: string | null
}
export type ListBundleModel = {
  bundles?: BundleModel[]
  productionBundle?: string | null
  stagingBundle?: string | null
  devBundles?: string[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
  input?: any
  ctx?: object
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type BundleIssueModel = {
  severity: 'error' | 'warning'
  addon?: string | null
  message: string
  requiredAddon?: string | null
}
export type CheckBundleResponseModel = {
  success?: boolean
  issues?: BundleIssueModel[]
}
export type BundlePatchModel = {
  description?: string | null
  addons?: {
    [key: string]: string | null
  } | null
  installerVersion?: string | null
  dependencyPackages?: DependencyPackages | null
  isProduction?: boolean | null
  isStaging?: boolean | null
  isArchived?: boolean | null
  isDev?: boolean | null
  activeUser?: string | null
  addonDevelopment?: {
    [key: string]: AddonDevelopmentItem
  } | null
}
export type BundleActionModel = {
  action: 'promote'
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
