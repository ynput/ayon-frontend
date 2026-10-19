import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listTraitDefinitions: build.query<ListTraitDefinitionsApiResponse, ListTraitDefinitionsApiArg>({
      query: (queryArg) => ({
        url: `/api/traits`,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListTraitDefinitionsApiResponse =
  /** status 200 Successful Response */ TraitDefinitionListItem[]
export type ListTraitDefinitionsApiArg = {
  /** Limit the result to addons of the given bundle variant (production, staging or a dev bundle name). If not set, all installed addon versions are used. */
  variant?: string
}
export type TraitHashes = {
  /** Hash of the trait data model */
  schema?: string
  /** Hash of the trait class code */
  behavior?: string
  /** Hash of the description, titles and UI hints */
  meta?: string
}
export type TraitDefinitionListItem = {
  /** Versioned trait ID */
  id: string
  versionlessId: string
  version?: number
  name: string
  description?: string
  persistent?: boolean
  deprecated?: boolean
  /** Addon version which introduced the trait version */
  introducedIn?: string
  /** JSON Schema of the trait data */
  schema?: object
  /** Rendering hints for the frontend */
  ui?: object
  hashes?: TraitHashes
  /** Name of the addon providing the trait */
  addonName: string
  /** Installed addon versions providing the trait */
  addonVersions: string[]
  /** True if installed addon versions define the trait with different data models */
  conflict?: boolean
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
