import { ayonApi } from '../ayon'
import { logout } from '/src/features/user'

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
      },
    }),
  }),
})

//

export const { useGetInfoQuery, useLazyGetInfoQuery, useLogOutMutation } = getAuth
