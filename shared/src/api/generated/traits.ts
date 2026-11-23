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
    listProjectTraitFields: build.query<
      ListProjectTraitFieldsApiResponse,
      ListProjectTraitFieldsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/traitFields`,
        params: {
          variant: queryArg.variant,
        },
      }),
    }),
    listTraitFieldValues: build.query<ListTraitFieldValuesApiResponse, ListTraitFieldValuesApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/traitFields/values`,
        params: {
          trait: queryArg.trait,
          field: queryArg.field,
          search: queryArg.search,
          limit: queryArg.limit,
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
export type ListProjectTraitFieldsApiResponse =
  /** status 200 Successful Response */ ProjectTraitFields
export type ListProjectTraitFieldsApiArg = {
  projectName: string
  /** Bundle variant whose core addon settings are applied */
  variant?: string
}
export type ListTraitFieldValuesApiResponse =
  /** status 200 Successful Response */ TraitFieldValue[]
export type ListTraitFieldValuesApiArg = {
  projectName: string
  /** Trait ID, versionless for all versions */
  trait: string
  /** Field name */
  field: string
  /** Case insensitive substring of the value */
  search?: string
  limit?: number
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
export type TraitFieldInfo = {
  /** Field name */
  name: string
  title: string
  type: string
  description?: string
  /** Allowed values */
  enum?: any[] | null
  /** Trait versions having the field */
  versions?: number[]
  /** Representations with a value */
  count?: number
  synonyms?: string[]
}
export type TraitUsage = {
  /** Versionless trait ID */
  id: string
  /** Trait name */
  name: string
  description?: string
  versions?: number[]
  /** Representations with the trait */
  count?: number
  fields?: TraitFieldInfo[]
}
export type ProjectTraitFields = {
  traits?: TraitUsage[]
}
export type TraitFieldValue = {
  value: any
  count: number
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
