import { api } from '@shared/api/base'
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
    connectToYnputCloud: build.query<ConnectToYnputCloudApiResponse, ConnectToYnputCloudApiArg>({
      query: (queryArg) => ({
        url: `/api/connect/authorize`,
        params: {
          origin_url: queryArg.originUrl,
        },
      }),
    }),
    getFeedbackVerification: build.query<
      GetFeedbackVerificationApiResponse,
      GetFeedbackVerificationApiArg
    >({
      query: (queryArg) => ({
        url: `/api/connect/feedback`,
        params: {
          force: queryArg.force,
        },
      }),
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
export type ConnectToYnputCloudApiResponse = /** status 200 Successful Response */ any
export type ConnectToYnputCloudApiArg = {
  originUrl: string
}
export type GetFeedbackVerificationApiResponse =
  /** status 200 Successful Response */ UserVerificationResponse
export type GetFeedbackVerificationApiArg = {
  force?: boolean
}
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
  instanceName?: string
  /** Organization ID */
  orgId?: string
  /** Name of the organization */
  orgName?: string
  /** Name of the organization */
  orgTitle?: string
  /** Is the instance managed by Ynput Cloud? */
  managed?: boolean
  /** Collect saturated metrics */
  collectSaturatedMetrics?: boolean
  /** List of subscriptions */
  subscriptions?: YnputCloudSubscriptionModel[]
  /** Is the instance connected to Ynput Cloud? */
  connected?: boolean
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
export type UserVerificationResponse = {
  available?: boolean
  detail?: string
  data?: Record<string, any>
}
