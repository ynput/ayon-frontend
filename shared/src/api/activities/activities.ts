import { BaseAPI as api } from '@shared/api'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
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
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type DeleteProjectActivityApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectActivityApiArg = {
  projectName: string
  activityId: string
  'x-sender'?: string
  'x-sender-type'?: string
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
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
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
