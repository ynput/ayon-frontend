import api from '@api'

const transformAnatomyPresets = (data) => {
  const defaultPreset = { name: '_', title: '<default (built-in)>' }
  let primaryPreset = defaultPreset
  let presets = []
  for (const preset of data) {
    if (preset.primary)
      primaryPreset = { name: preset.name, title: `<default (${preset.name})>`, primary: 'PRIMARY' }
    presets.push({
      name: preset.name,
      title: preset.name,
      version: preset.version,
      primary: preset.primary ? 'PRIMARY' : '',
    })
  }
  return [primaryPreset, ...presets]
}

const getAnatomy = api.rest.injectEndpoints({
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
      transformResponse: (response) => transformAnatomyPresets(response.presets),
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
