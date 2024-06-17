import { ayonApi } from '../ayon'
import { onClearDashboard } from '@state/dashboard'
import { logout } from '@state/user'

const getAuth = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getInfo: build.query({
      query: () => ({
        url: '/api/info',
      }),
      providesTags: ['info'],
    }),
    logOut: build.mutation({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['info'],
      onCacheEntryAdded: async (arg, { dispatch }) => {
        dispatch(logout())
        // reset global state
        dispatch(ayonApi.util.resetApiState())
        // remove some local storage items
        localStorage.removeItem('projectMenu-pinned')
        localStorage.removeItem('dashboard-tasks-filter')
        localStorage.removeItem('currentProject')
        localStorage.removeItem('dashboard-selectedProjects')
        localStorage.removeItem('dashboard-tasks-collapsedColumns')
        localStorage.removeItem('dashboard-tasks-assignees')
        localStorage.removeItem('dashboard-tasks-selected')
        // clear dashboard state
        dispatch(onClearDashboard())
      },
    }),
  }),
})

//

export const { useGetInfoQuery, useLazyGetInfoQuery, useLogOutMutation } = getAuth
