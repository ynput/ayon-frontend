import api from '@shared/api'

const siteSettings = api.injectEndpoints({
  endpoints: (build) => ({
    getSiteSettingsSchema: build.query({
      query: ({ addonName, addonVersion }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/siteSettings/schema`,
        method: 'GET',
      }),

      providesTags: ['siteSettingsSchema'],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getSiteSettings: build.query({
      query: ({ addonName, addonVersion, siteId }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/siteSettings?site=${siteId}`,
        method: 'GET',
      }),
      providesTags: ['siteSettings'],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    setSiteSettings: build.mutation({
      query: ({ addonName, addonVersion, siteId, data }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/siteSettings?site=${siteId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['siteSettings'],
      async onQueryStarted(
        { addonName, addonVersion, siteId, data },
        { dispatch, queryFulfilled },
      ) {
        const putResult = dispatch(
          api.util.updateQueryData(
            'getSiteSettings',
            { addonName, addonVersion, siteId, data },
            (draft) => {
              Object.assign(draft, { ...data, [siteId]: data })
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          putResult.undo()
        }
      }, // onQueryStarted
    }), // setSiteSettings
  }), // endpoints
  overrideExisting: true,
})
export const {
  useGetSiteSettingsSchemaQuery,
  useGetSiteSettingsQuery,
  useSetSiteSettingsMutation,
} = siteSettings
