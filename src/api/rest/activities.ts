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
        headers: {
          'x-sender': queryArg['x-sender'],
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type DeleteProjectActivityApiResponse = /** status 200 Successful Response */ any
export type DeleteProjectActivityApiArg = {
  activityId: string
  projectName: string
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
