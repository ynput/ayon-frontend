import { api } from '@shared/api/base'
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
export type ManageInboxItemFilter = {
  /** Filter by the active flag when provided */
  active?: boolean
  /** Filter by read state when provided */
  read?: boolean
  /** Filter by whether the item belongs to the Important split */
  important?: boolean
}
export type ManageInboxItemRequest = {
  projectName: string
  /** List of reference_ids of items to be managed */
  ids?: string[]
  /** Status to set for the items */
  status: 'unread' | 'read' | 'inactive'
  /** Optional filter selecting which inbox items should be updated */
  itemFilter?: ManageInboxItemFilter
}
