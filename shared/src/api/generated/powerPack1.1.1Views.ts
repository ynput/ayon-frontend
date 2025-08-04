import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    powerpack111ViewsShareView: build.mutation<
      Powerpack111ViewsShareViewApiResponse,
      Powerpack111ViewsShareViewApiArg
    >({
      query: (queryArg) => ({
        url: `/api/addons/powerpack/1.1.1-views/views/${queryArg.viewType}/${queryArg.viewId}/share`,
        method: 'POST',
        body: queryArg.shareRequest,
        params: {
          project_name: queryArg.projectName,
        },
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type Powerpack111ViewsShareViewApiResponse = /** status 200 Successful Response */ any
export type Powerpack111ViewsShareViewApiArg = {
  viewType: string
  viewId: string
  projectName: string
  shareRequest: ShareRequest
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type ShareRequest = {
  visibility?: 'private' | 'public'
}
