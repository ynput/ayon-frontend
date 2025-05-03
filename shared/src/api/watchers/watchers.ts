import { BaseAPI as api } from '../../client'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
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
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetEntityWatchersApiResponse = /** status 200 Successful Response */ WatchersModel
export type GetEntityWatchersApiArg = {
  projectName: string
  entityType: string
  entityId: string
}
export type SetEntityWatchersApiResponse = /** status 201 Successful Response */ any
export type SetEntityWatchersApiArg = {
  projectName: string
  entityType: string
  entityId: string
  'x-sender'?: string
  watchersModel: WatchersModel
}
export type WatchersModel = {
  watchers: string[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
