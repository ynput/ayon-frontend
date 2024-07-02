import { updateUserPreferences } from '@/features/user'
import api from '@api'

const updateUser = api.injectEndpoints({
  endpoints: (build) => ({
    updateUser: build.mutation({
      query: ({ name, patch }) => ({
        url: `/api/users/${name}`,
        method: 'PATCH',
        body: patch,
      }),
      transformErrorResponse: (res) => res.data,
      invalidatesTags: (result, error, { name }) => [
        { type: 'user', id: name },
        { type: 'user', id: 'LIST' },
        ['info'],
      ],
    }),
    // update multiple users at once
    updateUsers: build.mutation({
      queryFn: async (updates, { dispatch }) => {
        const results = await Promise.all(
          updates.map(({ name, patch }) => {
            return dispatch(api.endpoints.updateUser.initiate({ name, patch }))
          }),
        )
        console.log(results)
        return results
      },
    }),
    updateUserName: build.mutation({
      query: ({ name, newName }) => ({
        url: `/api/users/${name}/rename`,
        method: 'PATCH',
        body: { newName },
      }),
      invalidatesTags: (result, error, { name }) => [
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
    updateUserPreferences: build.mutation({
      query: ({ name, preferences }) => ({
        url: `/api/users/${name}/frontendPreferences`,
        method: 'PATCH',
        body: preferences,
      }),
      transformErrorResponse: (res) => res.data,
      invalidatesTags: (result, error, { name }) => [
        { type: 'user', id: name },
        { type: 'user', id: 'LIST' },
        ['info'],
      ],
      async onQueryStarted({ preferences }, { dispatch, queryFulfilled, getState }) {
        // get current preferences
        const currentPreferences = getState().user?.data?.frontendPreferences || {}

        // update redux store with new preferences
        dispatch(updateUserPreferences(preferences))
        try {
          await queryFulfilled
        } catch {
          // revert to previous preferences
          dispatch(updateUserPreferences(currentPreferences))
        }
      }, // onQueryStarted
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
      invalidatesTags: (res, err, { token }) => [{ type: 'session', id: token }],
    }),
  }),
  overrideExisting: true,
})

export const {
  useUpdateUserMutation,
  useUpdateUsersMutation,
  useUpdateUserNameMutation,
  useUpdateUserPasswordMutation,
  useUpdateUserPreferencesMutation,
  useAddUserMutation,
  useDeleteUserMutation,
  useUpdateUserAPIKeyMutation,
  useInvalidateUserSessionMutation,
} = updateUser
