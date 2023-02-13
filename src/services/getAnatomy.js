import { ayonApi } from './ayon'

const getAnatomy = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getAnatomySchema: build.query({
      query: () => ({
        url: '/api/anatomy/schema',
      }),
    }),
    getAnatomyPresets: build.query({
      query: ({ preset }) => ({
        url: `/api/anatomy/presets/${preset}`,
      }),
    }),
  }),
})

//

export const { useGetAnatomySchemaQuery, useGetAnatomyPresetsQuery } = getAnatomy
