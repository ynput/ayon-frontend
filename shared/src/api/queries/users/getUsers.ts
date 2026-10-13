import { gqlApi, usersApi } from '@shared/api/generated'
import type { GetCurrentUserApiResponse } from '@shared/api/generated'
import type {
  GetActiveUsersCountQuery,
  GetAllAssigneesQuery,
  GetAllProjectUsersAsAssigneeQuery,
} from '@shared/api/generated'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import type { EnumItem } from '@shared/api/generated'
import { parseJSONField } from '../overview'
import { normalizeQueryError } from '@shared/api/base/queryError'
import { enumOptionsQueries, USERS_ENUM_TAGS } from '../enums'

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
          isStagingAllowed
          isGuest
          active
          accessGroups
          defaultAccessGroups
          hasPassword
          disablePasswordLogin
          allAttrib
        }
      }
    }
  }
`
const USERS_QUERY = `
  query UserList {
    users(last: 5000, isSupport: false) {
      edges {
        node {
          name
          isAdmin
          isManager
          isService
          isDeveloper
          isStagingAllowed
          isGuest
          active
          userPool
          accessGroups
          defaultAccessGroups
          hasPassword
          disablePasswordLogin
          inviteSentAt
          inviteAcceptedAt
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
  users(names: $names, isSupport: false) {
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
  users(last: 5000, projectName: $projectName, isSupport: false) {
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

export type AssigneeOption = {
  name: string
  fullName?: string
  avatarUrl: string
  hidden?: boolean
}

type AssigneesArgs = { names?: string[]; projectName?: string }

const enumItemToAssignee = (item: EnumItem): AssigneeOption => {
  const name = String(item.value)
  return {
    name,
    fullName: item.label,
    avatarUrl: `/api/users/${name}/avatar`,
    hidden: item.hidden,
  }
}

interface GetCurrentUserResult extends GetCurrentUserApiResponse {
  uiExposureLevel: number
}

type RestDefinitions = DefinitionsFromApi<typeof usersApi>
type RestTagTypes = TagTypesFromApi<typeof usersApi>
// update the definitions to include the new types
type RestUpdatedDefinitions = Omit<RestDefinitions, 'getCurrentUser'> & {
  getCurrentUser: OverrideResultType<RestDefinitions['getCurrentUser'], GetCurrentUserResult>
}

const enhancedApi = usersApi.enhanceEndpoints<RestTagTypes, RestUpdatedDefinitions>({
  endpoints: {
    getCurrentUser: {
      providesTags: [{ type: 'user', id: 'LIST' }],
    },
    getUser: {
      providesTags: (res) =>
        res ? [{ type: 'user', id: res.name }] : [{ type: 'user', id: 'LIST' }],
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

        return res?.data?.users.edges
          .filter((e: any) => e.node.name !== 'CloudServiceWorker')
          .map((e: any) => ({
            ...e.node,
            self: e.node.name === selfName,
            avatarUrl: `/api/users/${e.node.name}/avatar`,
            accessGroups: e.node.accessGroups ? JSON.parse(e.node.accessGroups) : {},
            attrib: parseJSONField(e.node.allAttrib),
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
          attrib: parseJSONField(e.node.allAttrib),
        })),
      providesTags: (res) =>
        res
          ? [...res.map((e: any) => ({ type: 'user', id: e.name })), { type: 'user', id: 'LIST' }]
          : ['user', { type: 'user', id: 'LIST' }],
    }),
    getUsersAssignee: build.query<AssigneeOption[], AssigneesArgs>({
      async queryFn({ names, projectName }, api, _extraOptions, baseQuery) {
        // the resolver applies the server's user visibility rules, but needs a project for non-managers
        if (!names && projectName) {
          const result = await api
            .dispatch(
              enumOptionsQueries.endpoints.getEnumOptions.initiate(
                {
                  enumName: 'users',
                  params: { project_name: projectName, mode: 'users', hide_inactive: true },
                },
                { subscribe: false, forceRefetch: api.forced },
              ),
            )
            .unwrap()
          if (result.error) return { error: normalizeQueryError(result.error) }
          return { data: result.items.map(enumItemToAssignee) }
        }

        const result = await baseQuery({
          url: '/graphql',
          method: 'POST',
          body: {
            query: names ? ASSIGNEES_BY_NAME_QUERY : ASSIGNEES_QUERY,
            variables: { names, projectName },
          },
        })
        if (result.error) return { error: normalizeQueryError(result.error) }

        const edges = (result.data as any)?.data?.users.edges ?? []
        return {
          data: edges.flatMap((u: any) =>
            u.node
              ? [
                  {
                    name: u.node.name,
                    fullName: u.node.attrib?.fullName ?? undefined,
                    avatarUrl: `/api/users/${u.node.name}/avatar`,
                  },
                ]
              : [],
          ),
        }
      },
      providesTags: (res) => [
        ...(res || []).map((user) => ({ type: 'user' as const, id: user.name })),
        { type: 'user', id: 'LIST' },
        ...USERS_ENUM_TAGS,
      ],
    }),
  }),
  overrideExisting: true,
})

type AssigneeNode = GetAllProjectUsersAsAssigneeQuery['users']['edges'][0]['node']
export type Assignee = {
  name: AssigneeNode['name']
  fullName: AssigneeNode['attrib']['fullName']
  updatedAt: AssigneeNode['updatedAt']
}
export type Assignees = Assignee[]

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

export const { useGetUserSessionsQuery, useGetCurrentUserQuery, useGetUserQuery } = enhancedApi
export default injectedApi
