import api from '@api'

const getAnatomy = api.injectEndpoints({
  endpoints: (build) => ({
    getAnatomySchema: build.query({
      query: () => ({
        url: '/api/anatomy/schema',
      }),
    }),
    getAnatomyPreset: build.query({
      query: ({ preset }) => ({
        url: `/api/anatomy/presets/${preset}`,
      }),
      providesTags: (result, error, { preset }) => [{ type: 'anatomyPresets', id: preset }],
    }),
    getAnatomyPresets: build.query({
      query: () => ({
        url: `/api/anatomy/presets`,
      }),
      transformResponse: (response) => response.presets,
      providesTags: (result) => [
        ...result.map(({ name }) => ({ type: 'anatomyPresets', id: name })),
        { type: 'anatomyPresets', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
})

//

export const { useGetAnatomySchemaQuery, useGetAnatomyPresetQuery, useGetAnatomyPresetsQuery } =
  getAnatomy
