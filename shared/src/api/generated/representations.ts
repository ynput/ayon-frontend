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
    updateRepresentation: build.mutation<
      UpdateRepresentationApiResponse,
      UpdateRepresentationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations/${queryArg.representationId}`,
        method: 'PATCH',
        body: queryArg.representationPatchModel,
      }),
    }),
    deleteRepresentation: build.mutation<
      DeleteRepresentationApiResponse,
      DeleteRepresentationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/representations/${queryArg.representationId}`,
        method: 'DELETE',
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
export type UpdateRepresentationApiResponse = unknown
export type UpdateRepresentationApiArg = {
  projectName: string
  representationId: string
  representationPatchModel: RepresentationPatchModel
}
export type DeleteRepresentationApiResponse = unknown
export type DeleteRepresentationApiArg = {
  projectName: string
  representationId: string
}
export type CreateRepresentationApiResponse = /** status 201 Successful Response */ EntityIdResponse
export type CreateRepresentationApiArg = {
  projectName: string
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
  input?: any
  ctx?: object
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
  name?: string | null
  /** Path to the file */
  path: string
  /** Size of the file in bytes */
  size?: number
  hash?: string | null
  /** 'op3' is the default for OpenPype 3 imports */
  hashType?: 'md5' | 'sha1' | 'sha256' | 'op3'
}
export type RepresentationModel = {
  /** Unique identifier of the entity */
  id?: string
  /** The name of the representation */
  name: string
  /** ID of the parent version */
  versionId: string
  /** List of files */
  files?: RepresentationFileModel[]
  /** Dict of traits */
  traits?: {
    [key: string]: any
  } | null
  path?: string | null
  belongsToHero?: boolean | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  }
  /** Whether the entity is active */
  active?: boolean
  /** List of attributes explicitly set on the entity itself (not inherited) */
  ownAttrib?: string[]
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Time of creation */
  createdAt?: string
  /** Time of last update */
  updatedAt?: string
}
export type RepresentationPatchModel = {
  /** The name of the representation */
  name?: string | null
  /** ID of the parent version */
  versionId?: string | null
  /** List of files */
  files?: RepresentationFileModel[] | null
  /** Dict of traits */
  traits?: {
    [key: string]: any
  } | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[] | null
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  } | null
  /** Whether the entity is active */
  active?: boolean | null
}
export type EntityIdResponse = {
  /** Entity ID */
  id: string
}
export type RepresentationPostModel = {
  /** Unique identifier of the entity */
  id?: string
  /** The name of the representation */
  name: string
  /** ID of the parent version */
  versionId: string
  /** List of files */
  files?: RepresentationFileModel[]
  /** Dict of traits */
  traits?: {
    [key: string]: any
  } | null
  /** Status of the entity */
  status?: string | null
  /** Tags assigned to the entity */
  tags?: string[]
  /** Who created the entity */
  createdBy?: string | null
  /** Who last updated the entity */
  updatedBy?: string | null
  /** Attribute values of the entity */
  attrib?: {
    [key: string]: any
  }
  data?: {
    [key: string]: any
  }
  /** Whether the entity is active */
  active?: boolean
}
