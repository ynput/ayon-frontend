import { projectsApi } from '@shared/api/generated'

const enhancedGuestsApi = projectsApi.enhanceEndpoints({
  endpoints: {
    listGuestUsers: {
      providesTags: (result) =>
        result?.users
          ? [
              ...result.users.map(({ email }) => ({ type: 'guest', id: email })),
              { type: 'guest', id: 'LIST' },
            ]
          : [{ type: 'guest', id: 'LIST' }],
    },
    addGuestUser: {
      invalidatesTags: [{ type: 'guest', id: 'LIST' }],
    },
    removeGuestUser: {
      invalidatesTags: (result, error, arg) => [{ type: 'guest', id: arg.email }],
    },
  },
})

export const { useListGuestUsersQuery, useAddGuestUserMutation, useRemoveGuestUserMutation } =
  enhancedGuestsApi
