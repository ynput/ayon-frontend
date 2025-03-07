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
        // clear local storage
        localStorage.clear()
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
