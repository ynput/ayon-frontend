import { RestAPI as api } from '../../services/ayon'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getYnputCloudInfo: build.query<GetYnputCloudInfoApiResponse, GetYnputCloudInfoApiArg>({
      query: () => ({ url: `/api/connect` }),
    }),
    setYnputCloudKey: build.mutation<SetYnputCloudKeyApiResponse, SetYnputCloudKeyApiArg>({
      query: (queryArg) => ({
        url: `/api/connect`,
        method: 'POST',
        body: queryArg.ynputConnectRequestModel,
      }),
    }),
    deleteYnputCloudKey: build.mutation<DeleteYnputCloudKeyApiResponse, DeleteYnputCloudKeyApiArg>({
      query: () => ({ url: `/api/connect`, method: 'DELETE' }),
    }),
    getFeedbackVerification: build.query<
      GetFeedbackVerificationApiResponse,
      GetFeedbackVerificationApiArg
    >({
      query: () => ({ url: `/api/connect/feedback` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetYnputCloudInfoApiResponse = /** status 200 Successful Response */ YnputCloudInfoModel
export type GetYnputCloudInfoApiArg = void
export type SetYnputCloudKeyApiResponse = /** status 200 Successful Response */ YnputCloudInfoModel
export type SetYnputCloudKeyApiArg = {
  ynputConnectRequestModel: YnputConnectRequestModel
}
export type DeleteYnputCloudKeyApiResponse = /** status 200 Successful Response */ any
export type DeleteYnputCloudKeyApiArg = void
export type GetFeedbackVerificationApiResponse =
  /** status 200 Successful Response */ UserVerificationResponse
export type GetFeedbackVerificationApiArg = void
export type YnputCloudSubscriptionModel = {
  /** Name of the subscription */
  name: string
  /** Type of the subscription */
  productType: string
  /** End date of the trial */
  trialEnd?: string
}
export type YnputCloudInfoModel = {
  /** Ynput cloud instance ID */
  instanceId: string
  /** Name of the instance */
  instanceName: string
  /** Organization ID */
  orgId: string
  /** Name of the organization */
  orgName: string
  /** Name of the organization */
  orgTitle: string
  /** Collect saturated metrics */
  collectSaturatedMetrics?: boolean
  /** Is the instance managed by Ynput Cloud? */
  managed?: boolean
  /** List of subscriptions */
  subscriptions?: YnputCloudSubscriptionModel[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type YnputConnectRequestModel = {
  /** Ynput cloud key */
  key: string
}
export type UserCustomFields = {
  level?: string
  instanceId?: string
  verifiedUser?: string
}
export type CompanyInfo = {
  id: string
  name: string
  subscriptions?: string
}
export type UserVerificationResponse = {
  organization?: string
  name: string
  email: string
  userId: string
  userHash: string
  profilePicture?: string
  customFields: UserCustomFields
  companies: CompanyInfo[]
}
