import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    manageInboxItem: build.mutation<ManageInboxItemApiResponse, ManageInboxItemApiArg>({
      query: (queryArg) => ({
        url: `/api/inbox`,
        method: 'POST',
        body: queryArg.manageInboxItemRequest,
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ManageInboxItemApiResponse = /** status 200 Successful Response */ any
export type ManageInboxItemApiArg = {
  manageInboxItemRequest: ManageInboxItemRequest
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ManageInboxItemRequest = {
  projectName: string
  /** List of reference_ids of items to be managed */
  ids?: string[]
  /** If true, all items will be managed */
  all?: boolean
  /** Status to set for the items */
  status: 'unread' | 'read' | 'inactive'
}
