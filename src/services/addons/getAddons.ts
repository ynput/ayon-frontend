import { api } from '@api/rest/addons'

const addonsApi = api.enhanceEndpoints({
  endpoints: {
    listAddons: {
      providesTags: ['addonList'],
    },
    listFrontendModules: {},
  },
})

export const { useListAddonsQuery } = addonsApi

const addonsApiInjected = addonsApi.injectEndpoints({
  endpoints: (build) => ({
    // Return a list of addons which have project-scoped frontend
    getProjectAddons: build.query({
      query: () => ({
        url: `/api/addons`,
        method: 'GET',
      }),
      providesTags: ['projectAddons'],
      transformErrorResponse: (error: any) => error.data.detail || `Error ${error.status}`,
      transformResponse: (response: any) => {
        let result = []
        for (const definition of response.addons) {
          const versDef = definition.versions[definition.productionVersion]
          if (!versDef) continue
          const projectScope = versDef.frontendScopes['project']
          if (!projectScope) continue

          result.push({
            name: definition.name,
            title: definition.title,
            version: definition.productionVersion,
            settings: projectScope,
          })
        }
        return result
      },
    }),
    // Return a list of addons with settings-scoped frontend
    getSettingsAddons: build.query({
      query: () => ({
        url: `/api/addons`,
        method: 'GET',
      }),
      providesTags: ['settingsAddons'],
      transformErrorResponse: (error: any) => error.data.detail || `Error ${error.status}`,
      transformResponse: (response: any) => {
        let result = []
        for (const definition of response.addons) {
          const versDef = definition.versions[definition.productionVersion]
          if (!versDef) continue
          const settingsScope = versDef.frontendScopes['settings']
          if (!settingsScope) continue

          result.push({
            name: definition.name,
            title: definition.title,
            version: definition.productionVersion,
            settings: settingsScope,
          })
        }
        return result
      },
    }),
    // Return a list of addons with dashboard-scoped frontend
    getDashboardAddons: build.query({
      query: () => ({
        url: `/api/addons`,
        method: 'GET',
      }),
      providesTags: ['dashboardAddons'],
      transformErrorResponse: (error: any) => error.data.detail || `Error ${error.status}`,
      transformResponse: (response: any) => {
        let result = []
        for (const definition of response.addons) {
          const versDef = definition.versions[definition.productionVersion]
          if (!versDef) continue
          const settingsScope = versDef.frontendScopes['dashboard']
          if (!settingsScope) continue

          result.push({
            name: definition.name,
            title: definition.title,
            version: definition.productionVersion,
            settings: settingsScope,
          })
        }
        return result
      },
    }),
  }),
  overrideExisting: true,
})

export const {
  useGetProjectAddonsQuery,
  useGetSettingsAddonsQuery,
  useGetDashboardAddonsQuery,
  useListFrontendModulesQuery,
} = addonsApiInjected

export default addonsApiInjected
