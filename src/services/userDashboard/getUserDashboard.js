import { ayonApi } from '../ayon'
import { KAN_BAN_QUERY } from './userDashboardQueries'

const getUserDashboard = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getKanBan: build.query({
      query: ({ projectNames = [], assignees = [] }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: KAN_BAN_QUERY,
          variables: { projectNames, assignees },
        },
      }),
      // providesTags: (result,error, arg) => result,
    }),
  }),
})

//

export const { useGetInfoQuery, useLazyGetInfoQuery, useLogOutMutation } = getUserDashboard
