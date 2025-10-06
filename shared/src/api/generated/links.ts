import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listLinkTypes: build.query<ListLinkTypesApiResponse, ListLinkTypesApiArg>({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/links/types` }),
    }),
    saveLinkType: build.mutation<SaveLinkTypeApiResponse, SaveLinkTypeApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/links/types/${queryArg.linkType}`,
        method: 'PUT',
        body: queryArg.createLinkTypeRequestModel,
      }),
    }),
    deleteLinkType: build.mutation<DeleteLinkTypeApiResponse, DeleteLinkTypeApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/links/types/${queryArg.linkType}`,
        method: 'DELETE',
      }),
    }),
    createEntityLink: build.mutation<CreateEntityLinkApiResponse, CreateEntityLinkApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/links`,
        method: 'POST',
        body: queryArg.createLinkRequestModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    deleteEntityLink: build.mutation<DeleteEntityLinkApiResponse, DeleteEntityLinkApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/links/${queryArg.linkId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListLinkTypesApiResponse = /** status 200 Successful Response */ LinkTypeListResponse
export type ListLinkTypesApiArg = {
  projectName: string
}
export type SaveLinkTypeApiResponse = unknown
export type SaveLinkTypeApiArg = {
  projectName: string
  linkType: string
  createLinkTypeRequestModel: CreateLinkTypeRequestModel
}
export type DeleteLinkTypeApiResponse = unknown
export type DeleteLinkTypeApiArg = {
  projectName: string
  linkType: string
}
export type CreateEntityLinkApiResponse = /** status 200 Successful Response */ EntityIdResponse
export type CreateEntityLinkApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  createLinkRequestModel: CreateLinkRequestModel
}
export type DeleteEntityLinkApiResponse = unknown
export type DeleteEntityLinkApiArg = {
  projectName: string
  linkId: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type LinkTypeModel = {
  /** Name of the link type */
  name: string
  /** Type of the link */
  linkType: string
  /** Input entity type */
  inputType: string
  /** Output entity type */
  outputType: string
  /** Additional link type data */
  data?: Record<string, any>
}
export type LinkTypeListResponse = {
  /** List of link types defined in the project. */
  types: LinkTypeModel[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type CreateLinkTypeRequestModel = {
  /** Additional link type data (appearance, description, etc.). */
  data?: Record<string, any>
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type CreateLinkRequestModel = {
  /** ID of the link to create. If not provided, will be generated. */
  id?: string
  /** The ID of the input entity. */
  input: string
  /** The ID of the output entity. */
  output: string
  /** The name of the link. */
  name?: string
  /** Link type to create. */
  linkType?: string
  /** Additional data for the link. */
  data?: Record<string, any>
  /** Link type to create. This is deprecated. Use linkType instead. */
  link?: string
}
