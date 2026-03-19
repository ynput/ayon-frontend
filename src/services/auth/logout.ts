import { authenticationApi } from '@shared/api'
import { onClearDashboard } from '@state/dashboard'
import { logout } from '@state/user'

const authApiInjected = authenticationApi.enhanceEndpoints({
  endpoints: {
    logout: {
      invalidatesTags: ['info'],
      onCacheEntryAdded: async (arg, { dispatch }) => {
        dispatch(logout())
        // reset global state
        dispatch(authenticationApi.util.resetApiState())
        // clear local storage except for specific keys
        const keysToPreserve = ['installers-downloaded', 'releaseInstallPrompt'] // Add your specific keys here
        const allKeys = Object.keys(localStorage)
        allKeys.forEach((key) => {
          if (!keysToPreserve.includes(key)) {
            localStorage.removeItem(key)
          }
        })
        // clear dashboard state
        dispatch(onClearDashboard())
        // @ts-expect-error - no args are defined
        const redirect = arg?.redirect || '/login'
        // redirect to login
        window.location.href = redirect
      },
    },
  },
})

export const { useLogoutMutation } = authApiInjected
