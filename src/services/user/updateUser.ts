import { updateUserPreferences } from '@/features/user'
import globalApi from '@api'
import { api } from '@api/rest/users'
import { authApi } from '@shared/api'
import { $Any } from '@types'

const updateUserApi = api.enhanceEndpoints({
  endpoints: {
    setFrontendPreferences: {
      // @ts-expect-error - disableInvalidations is not in the api
      invalidatesTags: (_result, _error, { userName, disableInvalidations }) =>
        !disableInvalidations ? [{ type: 'user', id: userName }, 'info'] : [],
      async onQueryStarted({ patchData }, { dispatch, queryFulfilled, getState }) {
        // get current preferences
        // @ts-ignore
        const currentPreferences = getState().user?.data?.frontendPreferences || {}

        // update redux store with new preferences
        dispatch(updateUserPreferences(patchData))

        // optimistic update the user cache
        dispatch(
          authApi.util.updateQueryData('getCurrentUser', undefined, (draft) => {
            if (draft?.data) {
              draft.data.frontendPreferences = { ...draft.data.frontendPreferences, ...patchData }
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          // revert to previous preferences
          dispatch(updateUserPreferences(currentPreferences))
        }
      }, // onQueryStarted
    },
  },
})

export const { useSetFrontendPreferencesMutation } = updateUserApi

const updateUser = globalApi.injectEndpoints({
  endpoints: (build) => ({
    updateUser: build.mutation({
      query: ({ name, patch }) => ({
        url: `/api/users/${name}`,
        method: 'PATCH',
        body: patch,
      }),
      transformErrorResponse: (res) => res.data,
      invalidatesTags: (_result, _error, { name }) => [
        { type: 'user', id: name },
        { type: 'user', id: 'LIST' },
        { type: 'userPool', id: 'LIST' },
        { type: 'feedback', id: 'LIST' },
        'info',
      ],
    }),
    // update multiple users at once
    updateUsers: build.mutation({
      // @ts-ignore
      queryFn: async (updates, { dispatch }) => {
        const results = await Promise.all(
          updates.map(({ name, patch }: { name: string; patch: $Any }) => {
            // @ts-ignore
            return dispatch(globalApi.endpoints.updateUser.initiate({ name, patch }))
          }),
        )
        return results
      },
    }),
    updateUserName: build.mutation({
      query: ({ name, newName }) => ({
        url: `/api/users/${name}/rename`,
        method: 'PATCH',
        body: { newName },
      }),
      invalidatesTags: (_result, _error, { name }) => [
        { type: 'user', id: name },
        { type: 'user', id: 'LIST' },
      ],
      transformErrorResponse: (res) => res.data,
    }),
    updateUserPassword: build.mutation({
      query: ({ name, password }) => ({
        url: `/api/users/${name}/password`,
        method: 'PATCH',
        body: { password },
      }),
      invalidatesTags: () => ['user'],
      transformErrorResponse: (res) => res.data,
    }),
    addUser: build.mutation({
      query: ({ name, user }) => ({
        url: `/api/users/${name}`,
        method: 'PUT',
        body: user,
      }),
      transformErrorResponse: (res) => res.data,
      invalidatesTags: [{ type: 'user', id: 'LIST' }],
    }),
    deleteUser: build.mutation({
      query: ({ user }) => ({
        url: `/api/users/${user}`,
        method: 'DELETE',
      }),
      transformErrorResponse: (res) => res.data,
      invalidatesTags: () => [{ type: 'user', id: 'LIST' }],
    }),
    updateUserAPIKey: build.mutation({
      query: ({ name, apiKey }) => ({
        url: `/api/users/${name}/password`,
        method: 'PATCH',
        body: { apiKey },
      }),
      transformErrorResponse: (res) => res.data,
      invalidatesTags: () => [{ type: 'user', id: 'LIST' }],
    }),
    invalidateUserSession: build.mutation({
      query: ({ name, token }) => ({
        url: `/api/users/${name}/sessions/${token}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { token }) => [{ type: 'session', id: token }],
    }),
  }),
  overrideExisting: true,
})

export const {
  useUpdateUserMutation,
  useUpdateUsersMutation,
  useUpdateUserNameMutation,
  useUpdateUserPasswordMutation,
  useAddUserMutation,
  useDeleteUserMutation,
  useUpdateUserAPIKeyMutation,
  useInvalidateUserSessionMutation,
} = updateUser
