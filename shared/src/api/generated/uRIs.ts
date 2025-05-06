import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    resolveUris: build.mutation<ResolveUrisApiResponse, ResolveUrisApiArg>({
      query: (queryArg) => ({
        url: `/api/resolve`,
        method: 'POST',
        body: queryArg.resolveRequestModel,
        headers: {
          'x-ayon-site-id': queryArg['x-ayon-site-id'],
        },
        params: {
          pathOnly: queryArg.pathOnly,
        },
      }),
    }),
    getProjectEntityUris: build.mutation<
      GetProjectEntityUrisApiResponse,
      GetProjectEntityUrisApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/uris`,
        method: 'POST',
        body: queryArg.getUrisRequest,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ResolveUrisApiResponse = /** status 200 Successful Response */ ResolvedUriModel[]
export type ResolveUrisApiArg = {
  /** Return only file paths */
  pathOnly?: boolean
  /** Site ID may be specified either as a query parameter (`site_id` or `site`) or in a header. */
  'x-ayon-site-id'?: string
  resolveRequestModel: ResolveRequestModel
}
export type GetProjectEntityUrisApiResponse = /** status 200 Successful Response */ GetUrisResponse
export type GetProjectEntityUrisApiArg = {
  projectName: string
  getUrisRequest: GetUrisRequest
}
export type ResolvedEntityModel = {
  projectName?: string
  folderId?: string
  productId?: string
  taskId?: string
  versionId?: string
  representationId?: string
  workfileId?: string
  /** Path to the file if a representation is specified */
  filePath?: string
  /** The deepest entity type queried */
  target?: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
}
export type ResolvedUriModel = {
  uri: string
  entities?: ResolvedEntityModel[]
  /** Error message if the URI could not be resolved */
  error?: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ResolveRequestModel = {
  /** If x-ayon-site-id header is provided, resolve representation path roots */
  resolveRoots?: boolean
  /** List of uris to resolve */
  uris: string[]
}
export type UriResponseItem = {
  id: string
  uri: string
}
export type GetUrisResponse = {
  uris?: UriResponseItem[]
}
export type GetUrisRequest = {
  entityType: 'folder' | 'product' | 'version' | 'representation' | 'task' | 'workfile'
  ids?: string[]
}
