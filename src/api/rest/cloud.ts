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
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetYnputCloudInfoApiResponse =
  /** status 200 Successful Response */ YnputConnectResponseModel
export type GetYnputCloudInfoApiArg = void
export type SetYnputCloudKeyApiResponse =
  /** status 200 Successful Response */ YnputConnectResponseModel
export type SetYnputCloudKeyApiArg = {
  ynputConnectRequestModel: YnputConnectRequestModel
}
export type DeleteYnputCloudKeyApiResponse = /** status 200 Successful Response */ any
export type DeleteYnputCloudKeyApiArg = void
export type YnputConnectSubscriptionModel = {
  /** Name of the subscription */
  name: string
  /** Type of the subscription */
  productType: string
  /** End date of the trial */
  trialEnd?: string
}
export type YnputConnectResponseModel = {
  /** ID of the instance */
  instanceId: string
  /** Name of the instance */
  instanceName: string
  /** ID of the organization */
  orgId: string
  /** Name of the organization */
  orgName: string
  /** Collect saturated metrics */
  collectSaturatedMetrics?: boolean
  /** Is the instance managed by Ynput Cloud? */
  managed?: boolean
  /** List of subscriptions */
  subscriptions?: YnputConnectSubscriptionModel[]
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
