import { ayonApi } from '../ayon'

const updateUser = ayonApi.injectEndpoints({
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
    updateUserAvatar: build.mutation({
      query: ({ name, avatarUrl }) => ({
        url: `/api/users/${name}/avatar`,
        method: 'PUT',
        body: { avatarUrl },
      }),
      transformErrorResponse: (res) => res.data,
      invalidatesTags: (result, error, { name }) => [
        { type: 'user', id: name },
      ],
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
})

export const {
  useUpdateUserMutation,
  useUpdateUserNameMutation,
  useUpdateUserPasswordMutation,
  useUpdateUserAvatarMutation,
  useAddUserMutation,
  useDeleteUserMutation,
  useUpdateUserAPIKeyMutation,
  useInvalidateUserSessionMutation,
} = updateUser
