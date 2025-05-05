import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    listFrontendModules: build.query<ListFrontendModulesApiResponse, ListFrontendModulesApiArg>({
      query: () => ({ url: `/api/frontendModules` }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type ListFrontendModulesApiResponse =
  /** status 200 Successful Response */ FrontendModuleListItem[]
export type ListFrontendModulesApiArg = void
export type FrontendModuleListItem = {
  addonName: string
  addonVersion: string
  modules: {
    [key: string]: string[]
  }
}
