import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    deleteProjectActivity: build.mutation<
      DeleteProjectActivityApiResponse,
      DeleteProjectActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
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
        headers: { 'x-sender': queryArg['x-sender'] },
      }),
    }),
    deleteReactionToActivity: build.mutation<
      DeleteReactionToActivityApiResponse,
      DeleteReactionToActivityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/activities/${queryArg.activityId}/reactions/${queryArg.reaction}`,
        method: 'DELETE',
        headers: { 'x-sender': queryArg['x-sender'] },
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
}
export type CreateReactionToActivityApiResponse = /** status 201 Successful Response */ any
export type CreateReactionToActivityApiArg = {
  projectName: string
  activityId: string
  /** The sender of the request */
  'x-sender'?: string
  createReactionModel: CreateReactionModel
}
export type DeleteReactionToActivityApiResponse = /** status 204 Successful Response */ void
export type DeleteReactionToActivityApiArg = {
  /** The reaction to be deleted */
  reaction: string
  projectName: string
  activityId: string
  /** The sender of the request */
  'x-sender'?: string
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
