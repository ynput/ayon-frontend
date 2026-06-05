import {
  projectsApi,
  ListProjectsApiResponse,
  ListProjectsItemModel,
  gqlApi,
  GetProjectsQuery,
  GetProjectsQueryVariables,
  ProjectFragmentFragment,
} from '@shared/api/generated'

import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  OverrideResultType,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import { parseAllAttribs } from '../overview'
type Definitions = DefinitionsFromApi<typeof projectsApi>
type TagTypes = TagTypesFromApi<typeof projectsApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getProject'> & {
  listProjects: OverrideResultType<Definitions['listProjects'], ListProjectsItemModel[]>
}

const enhancedProject = projectsApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getProject: {
      transformErrorResponse: (error: any) => error.data.detail || `Error ${error.status}`,
      providesTags: (_res, _error, { projectName }) => [{ type: 'project', id: projectName }],
    },
    listProjects: {
      transformResponse: (res: ListProjectsApiResponse) => res?.projects || [],
      transformErrorResponse: (error: any) => error.data.detail || `Error ${error.status}`,
      providesTags: (_res, _error, { active }) => [
        { type: 'project' },
        { type: 'projects', id: (active ?? false).toString() },
        { type: 'projects', id: 'LIST' },
      ],
    },
    getProjectAnatomy: {
      providesTags: (_res, _error, { projectName }) => [{ type: 'project', id: projectName }],
    },
  },
})

// REST EXPORTS
export const { useGetProjectQuery, useListProjectsQuery, useGetProjectAnatomyQuery } =
  enhancedProject

// GRAPHQL
export type Project = ProjectFragmentFragment & { attrib: Record<string, any> }
export type GetProjectsResult = {
  projects: Project[]
  pageInfo: GetProjectsQuery['projects']['pageInfo']
}

type GQLDefinitions = DefinitionsFromApi<typeof gqlApi>
// update the definitions to include the new types
type GQLUpdatedDefinitions = Omit<GQLDefinitions, 'GetProjects'> & {
  GetProjects: OverrideResultType<GQLDefinitions['GetProjects'], GetProjectsResult>
}
//  it is impossible to group by folder or search with pagination, so just load tons and hope no one has more than 5 k projects.
export const PROJECTS_PER_PAGE = 2000

// enhance graphql - used only for the infinite query below
const enhancedGraphql = gqlApi.enhanceEndpoints<TagTypes, GQLUpdatedDefinitions>({
  endpoints: {
    GetProjects: {
      transformResponse: (res: GetProjectsQuery): GetProjectsResult => ({
        projects: res.projects.edges.map((edge) => ({
          ...edge.node,
          attrib: parseAllAttribs(edge.node.allAttrib),
        })),
        pageInfo: res.projects.pageInfo,
      }),
    },
  },
})

type ProjectsPageParam = { cursor: string; last?: number }

export const getProjectsGraphql = enhancedGraphql.injectEndpoints({
  endpoints: (build) => ({
    getProjectsInfinite: build.infiniteQuery<
      GetProjectsResult,
      Omit<GetProjectsQueryVariables, 'last' | 'before'>,
      ProjectsPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: { cursor: '', last: PROJECTS_PER_PAGE },
        getNextPageParam: (lastPage) => {
          const { pageInfo } = lastPage
          if (!pageInfo.hasPreviousPage || !pageInfo.endCursor) return undefined
          return {
            cursor: pageInfo.endCursor,
            last: PROJECTS_PER_PAGE,
          }
        },
      },
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const queryParams: GetProjectsQueryVariables = {
            ...queryArg,
            before: pageParam?.cursor || undefined,
            last: pageParam?.last,
          }

          const result = await api.dispatch(
            enhancedGraphql.endpoints.GetProjects.initiate(queryParams, { forceRefetch: true }),
          )

          if (result.error) throw result.error

          return {
            data: result.data || {
              projects: [],
              pageInfo: {
                hasNextPage: false,
                endCursor: null,
                startCursor: null,
                hasPreviousPage: false,
              },
            },
          }
        } catch (e: any) {
          console.error('Error in getProjectsInfinite queryFn:', e)
          return { error: { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError }
        }
      },
      providesTags: (result) => {
        const projects = result?.pages.flatMap((page) => page.projects) || []
        return [
          { type: 'project', id: 'LIST' },
          ...projects.map((project) => ({ type: 'project' as const, id: project.name })),
        ]
      },
    }),
  }),
  overrideExisting: true,
})

export const { useGetProjectsInfiniteInfiniteQuery } = getProjectsGraphql

export default enhancedProject
