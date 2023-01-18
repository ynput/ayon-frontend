import { ayonApi } from './ayon'

const USERS_QUERY = `
  query UserList {
    users {
      edges {
        node {
          name
          isAdmin
          isManager
          isService
          isGuest
          active
          roles
          defaultRoles
          hasPassword
          attrib {
            fullName
            email
          }
        }
      }
    }
  }
`

const getUsers = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query({
      query: () => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: USERS_QUERY,
          variables: {},
        },
      }),
      transformResponse: (res) => res?.data?.users.edges.map((e) => e.node),
    }),
  }),
})

export const { useGetUsersQuery } = getUsers
