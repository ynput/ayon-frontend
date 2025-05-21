
import { anatomyApi } from '@shared/api'

const enhancedApi = anatomyApi.enhanceEndpoints({
  endpoints: {
    updateAnatomyPreset: {
      invalidatesTags: (result, error, { presetName }) => [
        { type: 'anatomyPresets', id: presetName },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }, // updateAnatomyPreset

    renameAnatomyPreset: {
      invalidatesTags: (result, error, { presetName }) => [
        { type: 'anatomyPresets', id: presetName },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }, // renameAnatomyPreset

    deleteAnatomyPreset: {
      invalidatesTags: (result, error, { presetName }) => [
        { type: 'anatomyPresets', id: presetName },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }, // deleteAnatomyPreset

    setPrimaryPreset: {
      invalidatesTags: (result, error, { presetName }) => [
        { type: 'anatomyPresets', id: presetName },
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }, // setPrimaryPreset
  },
})


export const {
  useUpdateAnatomyPresetMutation,
  useRenameAnatomyPresetMutation,
  useDeleteAnatomyPresetMutation,
  useSetPrimaryPresetMutation,
} = enhancedApi

export { enhancedApi as anatomyApi }
