import { gqlApi, usersApi } from '@shared/api/generated'
import { parseAllAttribs } from '@shared/api'
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
          allAttrib
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
          allAttrib
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

const enhancedApi = usersApi.enhanceEndpoints({
  endpoints: {
    getCurrentUser: {
      providesTags: [{ type: 'user', id: 'LIST' }],
    },
    getUserSessions: {
      transformResponse: (res: any) => res?.sessions,
      providesTags: (_res, _g, { userName }) => [{ type: 'session', id: userName }],
    },
  },
})

const injectedApi = gqlApi.injectEndpoints({
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
      transformResponse: (res: any, _meta, { selfName }) => {
        if (res?.errors) {
          console.log(res.errors)
          throw new Error(res.errors[0].message)
        }

        return res?.data?.users.edges.map((e: any) => ({
          ...e.node,
          self: e.node.name === selfName,
          avatarUrl: `/api/users/${e.node.name}/avatar`,
          accessGroups: e.node.accessGroups ? JSON.parse(e.node.accessGroups) : {},
          attrib: parseAllAttribs(e.node.allAttrib),
        }))
      },
      providesTags: (users) =>
        users
          ? [...users.map((e: any) => ({ type: 'user', id: e.name })), { type: 'user', id: 'LIST' }]
          : [{ type: 'user', id: 'LIST' }],
    }),
    getUserByName: build.query({
      query: ({ name }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: USER_BY_NAME_QUERY,
          variables: { name },
        },
      }),
      transformResponse: (res: any) =>
        res?.data?.users.edges.map((e: any) => ({
          ...e.node,
          avatarUrl: `/api/users/${e.node?.name}/avatar`,
          attrib: parseAllAttribs(e.node.allAttrib),
        })),
      providesTags: (res) =>
        res
          ? [...res.map((e: any) => ({ type: 'user', id: e.name })), { type: 'user', id: 'LIST' }]
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
      transformResponse: (res: any) =>
        res?.data?.users.edges.flatMap((u: any) => {
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
              ...res.map((user: any) => ({ type: 'user', id: user.name })),
              { type: 'user', id: 'LIST' },
            ]
          : [{ type: 'user', id: 'LIST' }],
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
type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetAllProjectUsersAsAssignee'> & {
  GetAllProjectUsersAsAssignee: OverrideResultType<
    Definitions['GetAllProjectUsersAsAssignee'],
    Assignees
  >
  GetActiveUsersCount: OverrideResultType<Definitions['GetActiveUsersCount'], number>
  GetAllAssignees: OverrideResultType<Definitions['GetAllAssignees'], Assignees>
}

const gqlUsers = injectedApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
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
  useGetAllProjectUsersAsAssigneeQuery,
  useLazyGetAllProjectUsersAsAssigneeQuery,
  useGetActiveUsersCountQuery,
  useGetAllAssigneesQuery,
  useGetUsersQuery,
  useGetUserByNameQuery,
  useGetUsersAssigneeQuery,
} = gqlUsers

export const { useGetUserSessionsQuery, useGetCurrentUserQuery } = enhancedApi
export default injectedApi
