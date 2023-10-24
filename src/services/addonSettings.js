import { ayonApi } from './ayon'

const apiSuffix = (projectName, siteId, variant) => {
  let suffix = ''
  if (projectName && projectName !== '_') {
    suffix += `/${projectName}`
    if (siteId && siteId !== '_') {
      suffix += `?site=${siteId}`
    }
  }
  if (variant) {
    if (siteId && siteId !== '_') {
      suffix += `&variant=${variant}`
    } else {
      suffix += `?variant=${variant}`
    }
  }
  return suffix
}

const addonSettings = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAddonSettingsList: build.query({
      query: ({ variant, projectName, siteId }) => ({
        url: `/api/settings`,
        method: 'GET',
        params: { variant, project_name: projectName, site_id: siteId, summary: true },
      }),
      // eslint-disable-next-line no-unused-vars
      providesTags: (result, error, arg) => [
        { type: 'addonSettingsList', ...arg },
        { type: 'addonSettingsList' },
      ],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getAddonSettingsSchema: build.query({
      query: ({ addonName, addonVersion, projectName, siteId }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/schema${apiSuffix(projectName, siteId)}`,
        method: 'GET',
      }),

      // eslint-disable-next-line no-unused-vars
      providesTags: (result, error, arg) => [{ type: 'addonSettingsSchema', ...arg }],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getAddonSettings: build.query({
      query: ({ addonName, addonVersion, projectName, siteId, variant }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/settings${apiSuffix(
          projectName,
          siteId,
          variant,
        )}`,
        method: 'GET',
      }),

      // eslint-disable-next-line no-unused-vars
      providesTags: (result, error, arg) => [{ type: 'addonSettings', ...arg }],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    getAddonSettingsOverrides: build.query({
      query: ({ addonName, addonVersion, projectName, siteId, variant }) => ({
        url: `/api/addons/${addonName}/${addonVersion}/overrides${apiSuffix(
          projectName,
          siteId,
          variant,
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
