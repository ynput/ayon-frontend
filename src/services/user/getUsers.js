import { ayonApi } from '../ayon'
import ayonClient from '/src/ayon'

const USER_BY_NAME_QUERY = `
  query UserList($name:String!) {
    users(name: $name) {
      edges {
        node {
          name
          isAdmin
          isManager
          isService
          isDeveloper
          isGuest
          active
          accessGroups
          defaultAccessGroups
          hasPassword
          attrib {
            #ATTRS#
          }
        }
      }
    }
  }
`
const USERS_QUERY = `
  query UserList {
    users(last: 2000) {
      edges {
        node {
          name
          isAdmin
          isManager
          isService
          isDeveloper
          isGuest
          active
          accessGroups
          defaultAccessGroups
          hasPassword
          createdAt
          updatedAt
          apiKeyPreview
          attrib {
            #ATTRS#
          }
        }
      }
    }
  }
`

const ASSIGNEES_BY_NAME_QUERY = `
query Assignees($names: [String!]!){
  users(names: $names) {
  edges {
    node {
      name
      attrib {
        fullName
      }
    }
  }
}
}`
const ASSIGNEES_QUERY = `
query Assignees($projectName: String) {
  users(last: 2000 projectName: $projectName) {
  edges {
    node {
      name
      attrib {
        fullName
      }
    }
  }
}
}`

const buildUsersQuery = (QUERY) => {
  let f_attribs = ''
  for (const attrib of ayonClient.settings.attributes) {
    if (attrib.scope.includes('user')) f_attribs += `${attrib.name}\n`
  }

  if (!QUERY) return null

  return QUERY.replace('#ATTRS#', f_attribs)
}

const getUsers = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getUsersList: build.query({
      query: () => ({
        url: '/api/users',
      }),
      transformResponse: (res) => res?.data?.users.edges.map((e) => e.node),
      providesTags: () => ['user', { type: 'user', id: 'LIST' }],
    }),
    getUsers: build.query({
      query: () => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildUsersQuery(USERS_QUERY),
          variables: {},
        },
      }),
      transformResponse: (res, meta, { selfName }) => {
        if (res?.errors) {
          console.log(res.errors)
          throw new Error(res.errors[0].message)
        }

        return res?.data?.users.edges.map((e) => ({
          ...e.node,
          self: e.node.name === selfName,
          avatarUrl: `/api/users/${e.node.name}/avatar`,
          accessGroups: e.node.accessGroups ? JSON.parse(e.node.accessGroups) : {},
        }))
      },
      providesTags: (users) =>
        users
          ? [...users.map((e) => ({ type: 'user', id: e.name })), { type: 'user', id: 'LIST' }]
          : ['user', { type: 'user', id: 'LIST' }],
    }),
    getUser: build.query({
      query: ({ name }) => ({
        url: `/api/users/${name}`,
      }),
      providesTags: (res, g, { name }) => [
        { type: 'user', id: name },
        { type: 'user', id: 'LIST' },
      ],
    }),
    getUserByName: build.query({
      query: ({ name }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildUsersQuery(USER_BY_NAME_QUERY),
          variables: { name },
        },
      }),
      transformResponse: (res) =>
        res?.data?.users.edges.map((e) => ({
          ...e.node,
          avatarUrl: `/api/users/${e.node?.name}/avatar`,
        })),
      providesTags: (res) =>
        res
          ? [...res.map((e) => ({ type: 'user', id: e.name }, { type: 'user', id: 'LIST' }))]
          : ['user', { type: 'user', id: 'LIST' }],
    }),
    getUsersAssignee: build.query({
      query: ({ names, projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: names ? ASSIGNEES_BY_NAME_QUERY : ASSIGNEES_QUERY,
          variables: { names, projectName },
        },
      }),
      transformResponse: (res) =>
        res?.data?.users.edges.flatMap((u) => {
          if (!u.node) return []

          const n = u.node

          return {
            name: n.name,
            fullName: n.attrib?.fullName,
            avatarUrl: `/api/users/${n.name}/avatar`,
          }
        }),
      providesTags: (res) =>
        res
          ? [...res.map((user) => ({ type: 'user', id: user.name })), { type: 'user', id: 'LIST' }]
          : [{ type: 'user', id: 'LIST' }],
    }),
    getMe: build.query({
      query: () => ({
        url: '/api/users/me',
      }),
      providesTags: (res) => [
        { type: 'user', id: res?.name },
        { type: 'user', id: 'LIST' },
      ],
    }),
    getUserSessions: build.query({
      query: ({ name }) => ({
        url: `/api/users/${name}/sessions`,
      }),
      transformResponse: (res) => res?.sessions,
      providesTags: (res, g, { token }) => [{ type: 'session', id: token }],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUsersListQuery,
  useGetUserByNameQuery,
  useGetUserQuery,
  useLazyGetUserQuery,
  useGetUsersAssigneeQuery,
  useGetMeQuery,
  useGetUserAvatarQuery,
  useGetUserSessionsQuery,
} = getUsers
