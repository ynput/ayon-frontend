import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postProjectActivity: build.mutation<PostProjectActivityApiResponse, PostProjectActivityApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/${queryArg.entityType}/${queryArg.entityId}/activities`,
        method: 'POST',
        body: queryArg.projectActivityPostModel,
      }),
    }),
    deleteProjectActivity: build.mutation<
      DeleteProjectActivityApiResponse,
      DeleteProjectActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}`,
        method: 'DELETE',
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
      }),
    }),
    deleteReactionToActivity: build.mutation<
      DeleteReactionToActivityApiResponse,
      DeleteReactionToActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}/reactions/${queryArg.reaction}`,
        method: 'DELETE',
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
  projectActivityPostModel: ProjectActivityPostModel
}
export type DeleteProjectActivityApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectActivityApiArg = {
  projectName: string
  activityId: string
}
export type PatchProjectActivityApiResponse = /** status 200 Successful Response */ any
export type PatchProjectActivityApiArg = {
  projectName: string
  activityId: string
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
  createReactionModel: CreateReactionModel
}
export type DeleteReactionToActivityApiResponse = unknown
export type DeleteReactionToActivityApiArg = {
  /** The reaction to be deleted */
  reaction: string
  projectName: string
  activityId: string
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
  watchersModel: WatchersModel
}
export type CreateActivityResponseModel = {
  /** Activity ID */
  id: string
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
export type ProjectActivityPostModel = {
  /** Explicitly set the ID of the activity */
  id?: string | null
  activityType:
    | 'comment'
    | 'watch'
    | 'reviewable'
    | 'status.change'
    | 'assignee.add'
    | 'assignee.remove'
    | 'version.publish'
    | 'version.review'
    | 'attrib.change'
    | 'tags.change'
    | 'subtype.change'
  body?: string
  tags?: string[] | null
  files?: string[] | null
  timestamp?: string | null
  /** Additional data */
  data?: {
    [key: string]: any
  } | null
}
export type ActivityPatchModel = {
  /** When set, update the activity body */
  body?: string | null
  /** When set, update the activity tags */
  tags?: string[] | null
  /** When set, update the activity files */
  files?: string[] | null
  /** When true, append files to the existing ones. replace them otherwise */
  appendFiles?: boolean
  data?: {
    [key: string]: any
  } | null
}
export type ActivityCategoriesResponseModel = {
  categories: {
    [key: string]: any
  }[]
}
export type CreateReactionModel = {
  /** The reaction to be created */
  reaction: string
}
export type UserSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string | null
  /** The relevance score of the suggestion */
  relevance?: number | null
  name: string
  fullName?: string | null
}
export type TeamSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string | null
  /** The relevance score of the suggestion */
  relevance?: number | null
  name: string
}
export type FolderSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string | null
  /** The relevance score of the suggestion */
  relevance?: number | null
  id: string
  folderType: string
  name: string
  label?: string | null
  thumbnailId?: string | null
}
export type TaskSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string | null
  /** The relevance score of the suggestion */
  relevance?: number | null
  id: string
  taskType: string
  name: string
  label?: string | null
  thumbnailId?: string | null
  parent?: FolderSuggestionItem | null
}
export type ProductSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string | null
  /** The relevance score of the suggestion */
  relevance?: number | null
  id: string
  name: string
  productType: string
  parent?: FolderSuggestionItem | null
}
export type VersionSuggestionItem = {
  /** The date and time when the suggested entity was created */
  createdAt?: string | null
  /** The relevance score of the suggestion */
  relevance?: number | null
  id: string
  version: number
  parent?: ProductSuggestionItem | null
  name?: string | null
}
export type SuggestResponse = {
  users?: UserSuggestionItem[]
  teams?: TeamSuggestionItem[]
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
