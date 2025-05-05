import { api } from '@shared/api'
import { onClearDashboard } from '@state/dashboard'
import { logout } from '@state/user'

const authApiInjected = api.injectEndpoints({
  endpoints: (build) => ({
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

export const { useLogOutMutation } = authApiInjected
