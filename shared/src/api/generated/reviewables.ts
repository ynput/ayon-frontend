import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReviewablesForProduct: build.query<
      GetReviewablesForProductApiResponse,
      GetReviewablesForProductApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}/reviewables`,
        params: {
          latest: queryArg.latest,
          latest_done: queryArg.latestDone,
        },
      }),
    }),
    getReviewablesForVersion: build.query<
      GetReviewablesForVersionApiResponse,
      GetReviewablesForVersionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables`,
        params: {
          latest: queryArg.latest,
          latest_done: queryArg.latestDone,
        },
      }),
    }),
    sortVersionReviewables: build.mutation<
      SortVersionReviewablesApiResponse,
      SortVersionReviewablesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables`,
        method: 'PATCH',
        body: queryArg.sortReviewablesRequest,
      }),
    }),
    uploadReviewable: build.mutation<UploadReviewableApiResponse, UploadReviewableApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables`,
        method: 'POST',
        headers: {
          'x-file-name': queryArg['x-file-name'],
          'content-type': queryArg['content-type'],
        },
        params: {
          label: queryArg.label,
        },
      }),
    }),
    getReviewablesForTask: build.query<
      GetReviewablesForTaskApiResponse,
      GetReviewablesForTaskApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/reviewables`,
        params: {
          latest: queryArg.latest,
          latest_done: queryArg.latestDone,
        },
      }),
    }),
    getReviewablesForFolder: build.query<
      GetReviewablesForFolderApiResponse,
      GetReviewablesForFolderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/reviewables`,
        params: {
          latest: queryArg.latest,
          latest_done: queryArg.latestDone,
        },
      }),
    }),
    getReviewablesForEntities: build.mutation<
      GetReviewablesForEntitiesApiResponse,
      GetReviewablesForEntitiesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/${queryArg.entityType}/reviewables/list`,
        method: 'POST',
        body: queryArg.reviewablesRequestModel,
        params: {
          latest: queryArg.latest,
          latest_done: queryArg.latestDone,
        },
      }),
    }),
    updateReviewable: build.mutation<UpdateReviewableApiResponse, UpdateReviewableApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables/${queryArg.activityId}`,
        method: 'PATCH',
        body: queryArg.updateReviewablesRequest,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetReviewablesForProductApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForProductApiArg = {
  projectName: string
  productId: string
  /** If True, returns only the latest version */
  latest?: boolean
  /** If True, returns only the latest approved versions */
  latestDone?: boolean
}
export type GetReviewablesForVersionApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel
export type GetReviewablesForVersionApiArg = {
  projectName: string
  versionId: string
  /** If True, returns only the latest version */
  latest?: boolean
  /** If True, returns only the latest approved versions */
  latestDone?: boolean
}
export type SortVersionReviewablesApiResponse = /** status 200 Successful Response */ any
export type SortVersionReviewablesApiArg = {
  projectName: string
  versionId: string
  sortReviewablesRequest: SortReviewablesRequest
}
export type UploadReviewableApiResponse = /** status 200 Successful Response */ ReviewableModel
export type UploadReviewableApiArg = {
  projectName: string
  versionId: string
  /** Label */
  label?: string | null
  'x-file-name': string
  'content-type': string
}
export type GetReviewablesForTaskApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForTaskApiArg = {
  projectName: string
  taskId: string
  /** If True, returns only the latest version */
  latest?: boolean
  /** If True, returns only the latest approved versions */
  latestDone?: boolean
}
export type GetReviewablesForFolderApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForFolderApiArg = {
  projectName: string
  folderId: string
  /** If True, returns only the latest version */
  latest?: boolean
  /** If True, returns only the latest approved versions */
  latestDone?: boolean
}
export type GetReviewablesForEntitiesApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForEntitiesApiArg = {
  projectName: string
  /** Project level entity type is used in the endpoint path to specify the type of entity to operate on. It is usually one of 'folders', 'products', 'versions', 'representations', 'tasks', 'workfiles'. (trailing 's' is optional). */
  entityType: string
  /** If True, returns only the latest version */
  latest?: boolean
  /** If True, returns only the latest approved versions */
  latestDone?: boolean
  reviewablesRequestModel: ReviewablesRequestModel
}
export type UpdateReviewableApiResponse = /** status 200 Successful Response */ any
export type UpdateReviewableApiArg = {
  projectName: string
  versionId: string
  activityId: string
  updateReviewablesRequest: UpdateReviewablesRequest
}
export type ReviewableProcessingStatus = {
  eventId?: string | null
  status: string
  description: string
}
export type ReviewableAuthor = {
  name: string
  fullName?: string | null
}
export type ReviewableModel = {
  fileId: string
  activityId: string
  filename: string
  label?: string | null
  mimetype: string
  availability?: 'unknown' | 'conversionRequired' | 'conversionRecommended' | 'ready'
  mediaInfo?: {
    [key: string]: any
  } | null
  createdFrom?: string | null
  /** Information about the processing status */
  processing?: ReviewableProcessingStatus | null
  createdAt?: string
  updatedAt?: string
  author: ReviewableAuthor
}
export type VersionReviewablesModel = {
  id: string
  name: string
  version: string
  status: string
  productId: string
  productName: string
  productType: string
  attrib?: {
    [key: string]: any
  }
  /** List of available reviewables */
  reviewables?: ReviewableModel[]
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
export type SortReviewablesRequest = {
  /** List of reviewable (activity) ids in the order you want them to appear in the UI. */
  sort?: string[] | null
}
export type ReviewablesRequestModel = {
  /** List of target Entity IDs (folders, products, versions, etc.) to fetch reviewables for. */
  entityIds: string[]
}
export type UpdateReviewablesRequest = {
  label?: string | null
}
