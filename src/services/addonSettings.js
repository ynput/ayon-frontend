import { ayonApi } from './ayon'

const apiSuffix = (projectName, siteId) => {
  let suffix = ''
  if (projectName && projectName !== '') {
    suffix += `/${projectName}`
    if (siteId && siteId !== '') {
      suffix += `?site=${siteId}`
    }
  }
  return suffix
}

const addonSettings = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAddonSettingsSchema: build.query({
      query: ({ addonName, addonVersion, projectName, siteId }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/schema${apiSuffix(projectName, siteId)}`,
        method: 'GET',
      }),

      providesTags: ['addonSettingsSchema'],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getAddonSettings: build.query({
      query: ({ addonName, addonVersion, projectName, siteId }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/settings${apiSuffix(projectName, siteId)}`,
        method: 'GET',
      }),

      providesTags: ['addonSettings'],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getAddonSettingsOverrides: build.query({
      query: ({ addonName, addonVersion, projectName, siteId }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/overrides${apiSuffix(projectName, siteId)}`,
        method: 'GET',
      }),

      providesTags: ['addonSettingsOverrides'],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),
  }), // endpoints
}) // addonSettings

export const {
  useGetAddonSettingsSchemaQuery,
  useGetAddonSettingsQuery,
  useGetAddonSettingsOverridesQuery,
} = addonSettings
