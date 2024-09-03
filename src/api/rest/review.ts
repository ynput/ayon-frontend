import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReviewablesForProduct: build.query<
      GetReviewablesForProductApiResponse,
      GetReviewablesForProductApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/products/${queryArg.productId}/reviewables`,
      }),
    }),
    getReviewablesForVersion: build.query<
      GetReviewablesForVersionApiResponse,
      GetReviewablesForVersionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables`,
      }),
    }),
    uploadReviewable: build.mutation<UploadReviewableApiResponse, UploadReviewableApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/versions/${queryArg.versionId}/reviewables`,
        method: 'POST',
        headers: {
          'content-type': queryArg['content-type'],
          'x-file-name': queryArg['x-file-name'],
          'x-sender': queryArg['x-sender'],
        },
        params: {
          label: queryArg.label,
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
    getReviewablesForTask: build.query<
      GetReviewablesForTaskApiResponse,
      GetReviewablesForTaskApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/tasks/${queryArg.taskId}/reviewables`,
      }),
    }),
    getReviewablesForFolder: build.query<
      GetReviewablesForFolderApiResponse,
      GetReviewablesForFolderApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/folders/${queryArg.folderId}/reviewables`,
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
}
export type GetReviewablesForVersionApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel
export type GetReviewablesForVersionApiArg = {
  projectName: string
  versionId: string
}
export type UploadReviewableApiResponse = /** status 200 Successful Response */ ReviewableModel
export type UploadReviewableApiArg = {
  projectName: string
  versionId: string
  /** Label */
  label?: string
  'content-type': string
  'x-file-name': string
  'x-sender'?: string
}
export type SortVersionReviewablesApiResponse = /** status 200 Successful Response */ any
export type SortVersionReviewablesApiArg = {
  projectName: string
  versionId: string
  sortReviewablesRequest: SortReviewablesRequest
}
export type GetReviewablesForTaskApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForTaskApiArg = {
  projectName: string
  taskId: string
}
export type GetReviewablesForFolderApiResponse =
  /** status 200 Successful Response */ VersionReviewablesModel[]
export type GetReviewablesForFolderApiArg = {
  projectName: string
  folderId: string
}
export type UpdateReviewableApiResponse = /** status 200 Successful Response */ any
export type UpdateReviewableApiArg = {
  projectName: string
  versionId: string
  activityId: string
  updateReviewablesRequest: UpdateReviewablesRequest
}
export type ReviewableProcessingStatus = {
  eventId?: string
  status: string
  description: string
}
export type ReviewableAuthor = {
  name: string
  fullName?: string
}
export type ReviewableModel = {
  fileId: string
  activityId: string
  filename: string
  label?: string
  mimetype: string
  availability?: 'unknown' | 'conversionRequired' | 'conversionRecommended' | 'ready'
  mediaInfo?: object
  createdFrom?: string
  /** Information about the processing status */
  processing?: ReviewableProcessingStatus
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
  /** List of available reviewables */
  reviewables?: ReviewableModel[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type SortReviewablesRequest = {
  /** List of reviewable (activity) ids in the order you want them to appear in the UI. */
  sort?: string[]
}
export type UpdateReviewablesRequest = {
  label?: string
}
