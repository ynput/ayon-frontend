import api from '@shared/api'

const getAnatomy = api.injectEndpoints({
  endpoints: (build) => ({
    updatePreset: build.mutation({
      query: ({ name, data }) => ({
        url: `/api/anatomy/presets/${name}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { name }) => [
        { type: 'anatomyPresets', id: name },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }),
    deletePreset: build.mutation({
      query: ({ name }) => ({
        url: `/api/anatomy/presets/${name}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { name }) => [
        { type: 'anatomyPresets', id: name },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }),
    renamePreset: build.mutation({
      query: ({ name, newName }) => ({
        url: `/api/anatomy/presets/${name}/rename`,
        method: 'POST',
        body: { name: newName },
      }),
      invalidatesTags: (result, error, { name }) => [
        { type: 'anatomyPresets', id: name },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }),
    updatePrimaryPreset: build.mutation({
      query: ({ name }) => ({
        url: `/api/anatomy/presets/${name}/primary`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { name }) => [
        { type: 'anatomyPresets', id: name },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }),
    unsetPrimaryPreset: build.mutation({
      query: ({ name }) => ({
        url: `/api/anatomy/presets/${name}/primary`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { name }) => [
        { type: 'anatomyPresets', id: name },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
})

export const {
  useUpdatePresetMutation,
  useDeletePresetMutation,
  useRenamePresetMutation,
  useUpdatePrimaryPresetMutation,
  useUnsetPrimaryPresetMutation,
} = getAnatomy
