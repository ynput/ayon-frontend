import api from '@shared/api'
import ayonClient from '@/ayon'
import { $Any } from '@types'
import {
  GetActiveUsersCountQuery,
  GetAllAssigneesQuery,
  GetAllProjectUsersAsAssigneeQuery,
} from '@shared/api'

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
          userPool
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

const buildUsersQuery = (QUERY: string) => {
  let f_attribs = ''
  for (const attrib of ayonClient.settings.attributes as $Any) {
    if (attrib.scope.includes('user')) f_attribs += `${attrib.name}\n`
  }

  if (!QUERY) return null

  return QUERY.replace('#ATTRS#', f_attribs)
}

const injectedApi = api.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query({
      query: () => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildUsersQuery(USERS_QUERY),
          variables: {},
        },
      }),
      transformResponse: (res: $Any, _meta, { selfName }) => {
        if (res?.errors) {
          console.log(res.errors)
          throw new Error(res.errors[0].message)
        }

        return res?.data?.users.edges.map((e: $Any) => ({
          ...e.node,
          self: e.node.name === selfName,
          avatarUrl: `/api/users/${e.node.name}/avatar`,
          accessGroups: e.node.accessGroups ? JSON.parse(e.node.accessGroups) : {},
        }))
      },
      providesTags: (users) =>
        users
          ? [
              ...users.map((e: $Any) => ({ type: 'user', id: e.name })),
              { type: 'user', id: 'LIST' },
            ]
          : [{ type: 'user', id: 'LIST' }],
    }),
    getUser: build.query({
      query: ({ name }) => ({
        url: `/api/users/${name}`,
      }),
      providesTags: (_res, _g, { name }) => [
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
      transformResponse: (res: $Any) =>
        res?.data?.users.edges.map((e: $Any) => ({
          ...e.node,
          avatarUrl: `/api/users/${e.node?.name}/avatar`,
        })),
      providesTags: (res) =>
        res
          ? [...res.map((e: $Any) => ({ type: 'user', id: e.name })), { type: 'user', id: 'LIST' }]
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
      transformResponse: (res: $Any) =>
        res?.data?.users.edges.flatMap((u: $Any) => {
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
          ? [
              ...res.map((user: $Any) => ({ type: 'user', id: user.name })),
              { type: 'user', id: 'LIST' },
            ]
          : [{ type: 'user', id: 'LIST' }],
    }),
    getUserSessions: build.query({
      query: ({ name }) => ({
        url: `/api/users/${name}/sessions`,
      }),
      transformResponse: (res: $Any) => res?.sessions,
      providesTags: (_res, _g, { token }) => [{ type: 'session', id: token }],
    }),
  }),
  overrideExisting: true,
})

type AssigneeNode = GetAllProjectUsersAsAssigneeQuery['users']['edges'][0]['node']
export type Assignees = {
  name: AssigneeNode['name']
  fullName: AssigneeNode['attrib']['fullName']
  updatedAt: AssigneeNode['updatedAt']
}[]

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetAllProjectUsersAsAssignee'> & {
  GetAllProjectUsersAsAssignee: OverrideResultType<
    Definitions['GetAllProjectUsersAsAssignee'],
    Assignees
  >
  GetActiveUsersCount: OverrideResultType<Definitions['GetActiveUsersCount'], number>
  GetAllAssignees: OverrideResultType<Definitions['GetAllAssignees'], Assignees>
}

const enhancedApi = injectedApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetAllProjectUsersAsAssignee: {
      transformResponse: (res: GetAllProjectUsersAsAssigneeQuery) =>
        res.users.edges.map((e) => ({
          name: e.node.name,
          fullName: e.node.attrib.fullName,
          updatedAt: e.node.updatedAt,
        })),
      providesTags: (res) =>
        res
          ? [{ type: 'user', id: 'LIST' }, ...res.map((e) => ({ type: 'user', id: e.name }))]
          : [{ type: 'user', id: 'LIST' }],
    },
    GetActiveUsersCount: {
      transformResponse: (res: GetActiveUsersCountQuery) =>
        res.users.edges.filter((e) => e.node.active && !e.node.isGuest).length,
      providesTags: [{ type: 'user', id: 'LIST' }],
    },
    GetAllAssignees: {
      transformResponse: (res: GetAllAssigneesQuery) =>
        res.users.edges.map((e) => ({
          name: e.node.name,
          fullName: e.node.attrib.fullName,
          updatedAt: e.node.updatedAt,
        })),
      providesTags: (res) =>
        res
          ? [{ type: 'user', id: 'LIST' }, ...res.map((e) => ({ type: 'user', id: e.name }))]
          : [{ type: 'user', id: 'LIST' }],
    },
  },
})

export const {
  useGetUsersQuery,
  useGetUserByNameQuery,
  useGetUserQuery,
  useLazyGetUserQuery,
  useGetUsersAssigneeQuery,
  useGetUserSessionsQuery,
  useGetAllProjectUsersAsAssigneeQuery,
  useLazyGetAllProjectUsersAsAssigneeQuery,
  useGetActiveUsersCountQuery,
  useGetAllAssigneesQuery,
} = enhancedApi
