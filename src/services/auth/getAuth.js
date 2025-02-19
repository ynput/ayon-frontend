import { api } from '@api/rest/auth'
import { onClearDashboard } from '@state/dashboard'
import { logout } from '@state/user'

const authApi = api.enhanceEndpoints({
  endpoints: {
    createSession: {},
    getUserPools: {
      providesTags: [{ type: 'userPool', id: 'LIST' }],
    },
  },
})

const authApiInjected = authApi.injectEndpoints({
  endpoints: (build) => ({
    getInfo: build.query({
      query: () => ({
        url: '/api/info?full=true',
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
        dispatch(api.util.resetApiState())
        // remove some local storage items
        localStorage.removeItem('projectMenu-pinned')
        localStorage.removeItem('dashboard-tasks-filter')
        localStorage.removeItem('currentProject')
        localStorage.removeItem('dashboard-selectedProjects')
        localStorage.removeItem('dashboard-tasks-collapsedColumns')
        localStorage.removeItem('dashboard-tasks-assignees')
        localStorage.removeItem('dashboard-tasks-assigneesFilter')
        localStorage.removeItem('dashboard-tasks-selected')
        // clear dashboard state
        dispatch(onClearDashboard())
        const redirect = arg?.redirect || '/login'
        // redirect to login
        window.location.href = redirect
      },
    }),
  }),
  overrideExisting: true,
})

//

export const {
  useGetInfoQuery,
  useLazyGetInfoQuery,
  useLogOutMutation,
  useCreateSessionMutation,
  useGetUserPoolsQuery,
} = authApiInjected
