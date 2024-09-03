import { RestAPI as api } from '../../services/ayon'
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
  /** Organization name */
  orgName?: string
  /** Organization title */
  orgTitle?: string
  icon?: string
  /** Latest version of the addon */
  latestVersion?: string
  /** Links to the addon's homepage and GitHub repository */
  links?: LinkModel[]
  currentProductionVersion?: string
  currentLatestVersion?: string
  isOutdated?: boolean
}
export type AddonList = {
  addons?: AddonListItem[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type AddonVersionListItem = {
  version: string
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
  /** Organization name */
  orgName?: string
  /** Organization title */
  orgTitle?: string
  icon?: string
  /** Latest version of the addon */
  latestVersion?: string
  /** Links to the addon's homepage and GitHub repository */
  links?: LinkModel[]
  currentProductionVersion?: string
  currentLatestVersion?: string
  isOutdated?: boolean
  /** A list of versions of this addon */
  versions?: AddonVersionListItem[]
  /** A warning message to display to the user */
  warning?: string
}
export type AddonVersionDetail = {
  name: string
  title: string
  /** Addon description */
  description?: string
  /** Organization name */
  orgName?: string
  /** Organization title */
  orgTitle?: string
  icon?: string
  /** Latest version of the addon */
  latestVersion?: string
  /** Links to the addon's homepage and GitHub repository */
  links?: LinkModel[]
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
