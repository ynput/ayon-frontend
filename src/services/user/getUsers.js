import { ayonApi } from '../ayon'

const USERS_LIST_QUERY = `
query UserList {
  users {
    edges {
      node {
        name
      }
    }
  }
}
`

const USERS_BY_NAME_QUERY = `
  query UserList($names:[String!]!) {
    users(names: [$names]) {
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
    getUsersList: build.query({
      query: () => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: USERS_LIST_QUERY,
          variables: {},
        },
      }),
      transformResponse: (res) => res?.data?.users.edges.map((e) => e.node),
      providesTags: () => ['user'],
    }),
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
      providesTags: (res) =>
        res?.data?.users
          ? [...res.data.users.edges.map((e) => ({ type: 'user', name: e.name }))]
          : ['user'],
    }),
    getUsersByName: build.query({
      query: ({ names }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: USERS_BY_NAME_QUERY,
          variables: { names },
        },
      }),
      transformResponse: (res) => res?.data?.users.edges.map((e) => e.node),
      providesTags: (res) =>
        res?.data?.users
          ? [...res.data.users.edges.map((e) => ({ type: 'user', name: e.name }))]
          : ['user'],
    }),
  }),
})

export const { useGetUsersQuery, useGetUsersListQuery, useGetUsersByNameQuery } = getUsers
