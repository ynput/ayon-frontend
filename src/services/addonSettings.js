import api from '@shared/api'

const apiSuffix = (projectName, siteId, variant, asVersion) => {
  const params = new URLSearchParams()
  let suffix = ''

  if (projectName && projectName !== '_') {
    suffix += `/${projectName}`
    if (siteId && siteId !== '_') {
      params.append('site', siteId)
    }
  }

  if (variant) params.append('variant', variant)

  if (asVersion) params.append('as', asVersion)

  const qs = params.toString()
  return qs ? `${suffix}?${qs}` : suffix
}

const addonSettings = api.injectEndpoints({
  endpoints: (build) => ({
    getAddonSettingsList: build.query({
      query: ({ variant, projectName, siteId, bundleName, projectBundleName }) => {
        // this should prevent passing null/undefined values to the query
        // params once and for all (until we have typescript)

        // TODO: we would normally use 'summary: true' here to reduce the payload,
        // but fulltext search in settings actually neeed the data
        // so for now we leave it out
        const params = {}//{summary: true}
        if (variant) params.variant = variant
        if (projectName) params.project_name = projectName
        if (siteId) params.site_id = siteId
        if (bundleName) params.bundle_name = bundleName
        if (projectBundleName) params.project_bundle_name = projectBundleName

        return {
          url: `/api/settings`,
          method: 'GET',
          params,
        }
      },

      // eslint-disable-next-line no-unused-vars
      providesTags: (result, error, arg) => [
        { type: 'addonSettingsList', ...arg },
        { type: 'addonSettingsList' },
        { type: 'addonSettingsList', id: 'LIST' },
      ],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getAddonSettingsSchema: build.query({
      query: ({ addonName, addonVersion, projectName, siteId, variant }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/schema${apiSuffix(
          projectName,
          siteId,
          variant,
        )}`,
        method: 'GET',
      }),

      // eslint-disable-next-line no-unused-vars
      providesTags: (result, error, arg) => [{ type: 'addonSettingsSchema', ...arg }],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getAddonSettings: build.query({
      query: ({ addonName, addonVersion, projectName, siteId, variant, asVersion }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/settings${apiSuffix(
          projectName,
          siteId,
          variant,
          asVersion,
        )}`,
        method: 'GET',
      }),

      // eslint-disable-next-line no-unused-vars
      providesTags: (result, error, arg) => [{ type: 'addonSettings', ...arg }],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getAddonSettingsOverrides: build.query({
      query: ({ addonName, addonVersion, projectName, siteId, variant, asVersion }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/overrides${apiSuffix(
          projectName,
          siteId,
          variant,
          asVersion,
        )}`,
        method: 'GET',
      }),

      // eslint-disable-next-line no-unused-vars
      providesTags: (result, error, arg) => [{ type: 'addonSettingsOverrides', ...arg }],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getRawAddonSettingsOverrides: build.query({
      query: ({ addonName, addonVersion, projectName, siteId, variant }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/rawOverrides${apiSuffix(
          projectName,
          siteId,
          variant,
        )}`,
        method: 'GET',
      }),
    }),

    setRawAddonSettingsOverrides: build.mutation({
      query: ({ addonName, addonVersion, projectName, siteId, variant, data }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/rawOverrides${apiSuffix(
          projectName,
          siteId,
          variant,
        )}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        {
          type: 'addonSettings',
          addonName: arg.addonName,
          addonVersion: arg.addonVersion,
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
        {
          type: 'addonSettingsOverrides',
          addonName: arg.addonName,
          addonVersion: arg.addonVersion,
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
        {
          type: 'addonSettingsList',
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
      ],
      transformErrorResponse: (error) =>
        error.data.detail ? error.data : { detail: `Error ${error.status}` },
    }),

    setAddonSettings: build.mutation({
      query: ({ addonName, addonVersion, projectName, siteId, data, variant }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/settings${apiSuffix(
          projectName,
          siteId,
          variant,
        )}`,
        method: 'POST',
        body: data,
      }),

      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, arg) => [
        {
          type: 'addonSettings',
          addonName: arg.addonName,
          addonVersion: arg.addonVersion,
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
        {
          type: 'addonSettingsOverrides',
          addonName: arg.addonName,
          addonVersion: arg.addonVersion,
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
        {
          type: 'addonSettingsList',
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
      ],
      transformResponse: (response) => response,
      transformErrorResponse: (error) =>
        error.data.detail ? error.data : { detail: `Error ${error.status}` },
    }), // setAddonSettings

    deleteAddonSettings: build.mutation({
      query: ({ addonName, addonVersion, projectName, siteId, variant }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/overrides${apiSuffix(
          projectName,
          siteId,
          variant,
        )}`,
        method: 'DELETE',
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, arg) => [
        {
          type: 'addonSettings',
          addonName: arg.addonName,
          addonVersion: arg.addonVersion,
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
        {
          type: 'addonSettingsOverrides',
          addonName: arg.addonName,
          addonVersion: arg.addonVersion,
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
        {
          type: 'addonSettingsList',
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
      ],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }), // setAddonSettings

    modifyAddonOverride: build.mutation({
      query: ({ addonName, addonVersion, projectName, siteId, action, path, variant }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/overrides${apiSuffix(
          projectName,
          siteId,
          variant,
        )}`,
        method: 'POST',
        body: { action, path },
      }),
      // eslint-disable-next-line no-unused-vars
      invalidatesTags: (result, error, arg) => [
        {
          type: 'addonSettings',
          addonName: arg.addonName,
          addonVersion: arg.addonVersion,
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
        {
          type: 'addonSettingsOverrides',
          addonName: arg.addonName,
          addonVersion: arg.addonVersion,
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
        {
          type: 'addonSettingsList',
          projectName: arg.projectName,
          siteId: arg.siteId,
          variant: arg.variant,
        },
      ],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }), // setAddonSettings
  }), // endpoints
  overrideExisting: true,
}) // addonSettings

export const {
  useGetAddonSettingsListQuery,
  useGetAddonSettingsSchemaQuery,
  useGetAddonSettingsQuery,
  useLazyGetAddonSettingsQuery,
  useGetAddonSettingsOverridesQuery,
  useLazyGetAddonSettingsOverridesQuery,
  useSetAddonSettingsMutation,
  useDeleteAddonSettingsMutation,
  useModifyAddonOverrideMutation,
  useSetRawAddonSettingsOverridesMutation,
  useLazyGetRawAddonSettingsOverridesQuery,
} = addonSettings
