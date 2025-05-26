import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { usersApi } from '@shared/api/generated'

const updateUserApi = usersApi.enhanceEndpoints({
  endpoints: {
    deleteUser: {
      transformErrorResponse: (res) => res.data,
      invalidatesTags: () => [{ type: 'user', id: 'LIST' }],
    },
    setFrontendPreferences: {
      // @ts-expect-error - disableInvalidations is not in the api
      invalidatesTags: (_result, _error, { userName, disableInvalidations }) =>
        !disableInvalidations ? [{ type: 'user', id: userName }, 'info'] : [],
      async onQueryStarted({ patchData }, { dispatch, queryFulfilled, getState }) {
        // get current preferences

        // optimistic update the user cache
        const patch = dispatch(
          usersApi.util.updateQueryData('getCurrentUser', undefined, (draft) => {
            if (draft?.data) {
              draft.data.frontendPreferences = { ...draft.data.frontendPreferences, ...patchData }
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          // rollback the optimistic update if the query fails
          patch.undo()
        }
      }, // onQueryStarted
    },
  },
})

const updateUser = updateUserApi.injectEndpoints({
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

const updateUser2 = updateUser.injectEndpoints({
  endpoints: (build) => ({
    // update multiple users at once
    updateUsers: build.mutation<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any[],
      { name: string; patch: object }[]
    >({
      //
      queryFn: async (updates, { dispatch }) => {
        const results = await Promise.all(
          updates.map(({ name, patch }: { name: string; patch: object }) => {
            return dispatch(updateUser.endpoints.updateUser.initiate({ name, patch }))
          }),
        )

        // Check if any of the results have an error
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstError = results.find((result: any) => result.error)
        if (firstError) {
          return { error: firstError.error as FetchBaseQueryError }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { data: results.map((result: any) => result.data) }
      },
    }),
  }),
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
  useSetFrontendPreferencesMutation,
} = updateUser2
export { updateUser2 as userQueries }
