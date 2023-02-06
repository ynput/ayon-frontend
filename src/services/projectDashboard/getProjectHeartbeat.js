import { ayonApi } from '../ayon'

const getProjectHeartbeat = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectHeartbeat: build.query({
      query: ({ projectName }) => ({
        url: `project/${projectName}/dashboard/heartbeat`,
      }),
    }),
  }),
})

export const { useGetProjectHeartbeatQuery } = getProjectHeartbeat
