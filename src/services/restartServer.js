import { ayonApi } from './ayon'

const restartServer = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    restartServer: build.mutation({
      query: () => ({
        url: '/api/system/restart',
        method: 'POST',
      }),
    }),
  }),
})

export const { useRestartServerMutation } = restartServer
