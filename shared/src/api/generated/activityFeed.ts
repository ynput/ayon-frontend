import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postProjectActivity: build.mutation<PostProjectActivityApiResponse, PostProjectActivityApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/${queryArg.entityType}/${queryArg.entityId}/activities`,
        method: 'POST',
        body: queryArg.projectActivityPostModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    deleteProjectActivity: build.mutation<
      DeleteProjectActivityApiResponse,
      DeleteProjectActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    patchProjectActivity: build.mutation<
      PatchProjectActivityApiResponse,
      PatchProjectActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}`,
        method: 'PATCH',
        body: queryArg.activityPatchModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    getActivityCategories: build.query<
      GetActivityCategoriesApiResponse,
      GetActivityCategoriesApiArg
    >({
      query: (queryArg) => ({ url: `/api/projects/${queryArg.projectName}/activityCategories` }),
    }),
    createReactionToActivity: build.mutation<
      CreateReactionToActivityApiResponse,
      CreateReactionToActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}/reactions`,
        method: 'POST',
        body: queryArg.createReactionModel,
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    deleteReactionToActivity: build.mutation<
      DeleteReactionToActivityApiResponse,
      DeleteReactionToActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}/reactions/${queryArg.reaction}`,
        method: 'DELETE',
        headers: {
          'x-sender': queryArg['x-sender'],
          'x-sender-type': queryArg['x-sender-type'],
        },
      }),
    }),
    suggestEntityMention: build.mutation<
      SuggestEntityMentionApiResponse,
      SuggestEntityMentionApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/suggest`,
        method: 'POST',
        body: queryArg.suggestRequest,
      }),
    }),
    getEntityWatchers: build.query<GetEntityWatchersApiResponse, GetEntityWatchersApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/${queryArg.entityType}/${queryArg.entityId}/watchers`,
      }),
    }),
    setEntityWatchers: build.mutation<SetEntityWatchersApiResponse, SetEntityWatchersApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/${queryArg.entityType}/${queryArg.entityId}/watchers`,
        method: 'POST',
        body: queryArg.watchersModel,
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
export type PostProjectActivityApiResponse =
  /** status 201 Successful Response */ CreateActivityResponseModel
export type PostProjectActivityApiArg = {
  projectName: string
  /** Project level entity type is used in the endpoint path to specify the type of entity to operate on. It is usually one of 'folders', 'products', 'versions', 'representations', 'tasks', 'workfiles'. (trailing 's' is optional). */
  entityType: string
  entityId: string
  'x-sender'?: string
  'x-sender-type'?: string
  projectActivityPostModel: ProjectActivityPostModel
}
export type DeleteProjectActivityApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectActivityApiArg = {
  projectName: string
  activityId: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type PatchProjectActivityApiResponse = /** status 200 Successful Response */ any
export type PatchProjectActivityApiArg = {
  projectName: string
  activityId: string
  'x-sender'?: string
  'x-sender-type'?: string
  activityPatchModel: ActivityPatchModel
}
export type GetActivityCategoriesApiResponse =
  /** status 200 Successful Response */ ActivityCategoriesResponseModel
export type GetActivityCategoriesApiArg = {
  projectName: string
}
export type CreateReactionToActivityApiResponse = /** status 201 Successful Response */ any
export type CreateReactionToActivityApiArg = {
  projectName: string
  activityId: string
  'x-sender'?: string
  'x-sender-type'?: string
  createReactionModel: CreateReactionModel
}
export type DeleteReactionToActivityApiResponse = unknown
export type DeleteReactionToActivityApiArg = {
  /** The reaction to be deleted */
  reaction: string
  projectName: string
  activityId: string
  'x-sender'?: string
  'x-sender-type'?: string
}
export type SuggestEntityMentionApiResponse = /** status 200 Successful Response */ SuggestResponse
export type SuggestEntityMentionApiArg = {
  projectName: string
  suggestRequest: SuggestRequest
}
export type GetEntityWatchersApiResponse = /** status 200 Successful Response */ WatchersModel
export type GetEntityWatchersApiArg = {
  projectName: string
  /** Project level entity type is used in the endpoint path to specify the type of entity to operate on. It is usually one of 'folders', 'products', 'versions', 'representations', 'tasks', 'workfiles'. (trailing 's' is optional). */
  entityType: string
  entityId: string
}
export type SetEntityWatchersApiResponse = /** status 201 Successful Response */ any
export type SetEntityWatchersApiArg = {
  projectName: string
  /** Project level entity type is used in the endpoint path to specify the type of entity to operate on. It is usually one of 'folders', 'products', 'versions', 'representations', 'tasks', 'workfiles'. (trailing 's' is optional). */
  entityType: string
  entityId: string
  'x-sender'?: string
  'x-sender-type'?: string
  watchersModel: WatchersModel
}
export type CreateActivityResponseModel = {
  id: string
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ProjectActivityPostModel = {
  /** Explicitly set the ID of the activity */
  id?: string
  activityType:
    | 'comment'
    | 'watch'
    | 'reviewable'
    | 'status.change'
    | 'assignee.add'
    | 'assignee.remove'
    | 'version.publish'
  body?: string
  tags?: string[]
  files?: string[]
  timestamp?: string
  /** Additional data */
  data?: Record<string, any>
}
export type ActivityPatchModel = {
  /** When set, update the activity body */
  body?: string
  /** When set, update the activity tags */
  tags?: string[]
  /** When set, update the activity files */
  files?: string[]
  /** When true, append files to the existing ones. replace them otherwise */
  appendFiles?: boolean
  data?: Record<string, any>
}
export type ActivityCategoriesResponseModel = {
  categories: object[]
}
export type CreateReactionModel = {
  /** The reaction to be created */
  reaction: string
}
export type UserSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  name: string
  fullName?: string
}
export type FolderSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  id: string
  folderType: string
  name: string
  label?: string
  thumbnailId?: string
}
export type TaskSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  id: string
  taskType: string
  name: string
  label?: string
  thumbnailId?: string
  parent?: FolderSuggestionItem
}
export type ProductSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  id: string
  name: string
  productType: string
  parent?: FolderSuggestionItem
}
export type VersionSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string
  /** The relevance score of the suggestion */
  relevance?: number
  id: string
  version: number
  parent?: ProductSuggestionItem
  name?: string
}
export type SuggestResponse = {
  users?: UserSuggestionItem[]
  tasks?: TaskSuggestionItem[]
  versions?: VersionSuggestionItem[]
}
export type SuggestRequest = {
  entityType: 'folder' | 'task' | 'version'
  entityId: string
}
export type WatchersModel = {
  watchers: string[]
}
