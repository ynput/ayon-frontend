import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    representationContextFilter: build.mutation<
      RepresentationContextFilterApiResponse,
      RepresentationContextFilterApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/repreContextFilter`,
        method: 'POST',
        body: queryArg.lookupRequestModel,
      }),
    }),
    getRepresentation: build.query<GetRepresentationApiResponse, GetRepresentationApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations/${queryArg.representationId}`,
      }),
    }),
    deleteRepresentation: build.mutation<
      DeleteRepresentationApiResponse,
      DeleteRepresentationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations/${queryArg.representationId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    updateRepresentation: build.mutation<
      UpdateRepresentationApiResponse,
      UpdateRepresentationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations/${queryArg.representationId}`,
        method: 'PATCH',
        body: queryArg.representationPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    createRepresentation: build.mutation<
      CreateRepresentationApiResponse,
      CreateRepresentationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations`,
        method: 'POST',
        body: queryArg.representationPostModel,
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
export type RepresentationContextFilterApiResponse =
  /** status 200 Successful Response */ LookupResponseModel
export type RepresentationContextFilterApiArg = {
  projectName: string
  lookupRequestModel: LookupRequestModel
}
export type GetRepresentationApiResponse = /** status 200 Successful Response */ RepresentationModel
export type GetRepresentationApiArg = {
  projectName: string
  representationId: string
}
export type DeleteRepresentationApiResponse = unknown
export type DeleteRepresentationApiArg = {
  projectName: string
  representationId: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type UpdateRepresentationApiResponse = unknown
export type UpdateRepresentationApiArg = {
  projectName: string
  representationId: string
  'x-sender'?: string
  'x-sender-type'?: string
  representationPatchModel: RepresentationPatchModel
}
export type CreateRepresentationApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateRepresentationApiArg = {
  projectName: string
  'x-sender'?: string
  'x-sender-type'?: string
  representationPostModel: RepresentationPostModel
}
export type LookupResponseModel = {
  /** List of matching representation ids */
  ids?: string[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ContextFilterModel = {
  key: string
  /** List of regular expressions which at least one must match */
  values: string[]
}
export type LookupRequestModel = {
  names?: string[]
  versionIds?: string[]
  context?: ContextFilterModel[]
}
export type RepresentationFileModel = {
  /** Unique (within the representation) ID of the file */
  id: string
  /** File name */
  name?: string
  /** Path to the file */
  path: string
  /** Size of the file in bytes */
  size?: number
  hash?: string
  hashType?: 'md5' | 'sha1' | 'sha256' | 'op3'
}
export type RepresentationAttribModel = {
  /** Frame rate */
  fps?: number
  /** Horizontal resolution */
  resolutionWidth?: number
  /** Vertical resolution */
  resolutionHeight?: number
  pixelAspect?: number
  clipIn?: number
  clipOut?: number
  frameStart?: number
  frameEnd?: number
  handleStart?: number
  handleEnd?: number
  path?: string
  template?: string
  extension?: string
  /** Textual description of the entity */
  description?: string
}
export type RepresentationModel = {
  /** Unique identifier of the {entity_name} */
  id?: string
  /** The name of the representation */
  name: string
  /** ID of the parent version */
  versionId: string
  /** List of files */
  files?: RepresentationFileModel[]
  /** Dict of traits */
  traits?: object
  attrib?: RepresentationAttribModel
  data?: Record<string, any>
  /** Whether the representation is active */
  active?: boolean
  ownAttrib?: string[]
  /** Status of the representation */
  status?: string
  /** Tags assigned to the the representation */
  tags?: string[]
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type RepresentationPatchModel = {
  /** The name of the representation */
  name?: string
  /** ID of the parent version */
  versionId?: string
  /** List of files */
  files?: RepresentationFileModel[]
  /** Dict of traits */
  traits?: object
  /** Status of the representation */
  status?: string
  /** Tags assigned to the the representation */
  tags?: string[]
  attrib?: RepresentationAttribModel
  data?: Record<string, any>
  /** Whether the representation is active */
  active?: boolean
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type RepresentationPostModel = {
  /** Explicitly set the ID of the entity */
  id?: string
  /** The name of the representation */
  name: string
  /** ID of the parent version */
  versionId: string
  /** List of files */
  files?: RepresentationFileModel[]
  /** Dict of traits */
  traits?: object
  /** Status of the representation */
  status?: string
  /** Tags assigned to the the representation */
  tags?: string[]
  attrib?: RepresentationAttribModel
  data?: Record<string, any>
  /** Whether the representation is active */
  active?: boolean
}
