import { ayonApi } from '../ayon'

const getAnatomy = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updatePreset: build.mutation({
      query: ({ name, data }) => ({
        url: `/api/anatomy/presets/${name}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { name }) => [{ type: 'anatomyPresets', name: name }],
    }),
    deletePreset: build.mutation({
      query: ({ name }) => ({
        url: `/api/anatomy/presets/${name}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { name }) => [{ type: 'anatomyPresets', name: name }],
    }),
    updatePrimaryPreset: build.mutation({
      query: ({ name }) => ({
        url: `/api/anatomy/presets/${name}/primary`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { name }) => [{ type: 'anatomyPresets', name: name }],
    }),
  }),
})

export const { useUpdatePresetMutation, useDeletePresetMutation, useUpdatePrimaryPresetMutation } =
  getAnatomy
