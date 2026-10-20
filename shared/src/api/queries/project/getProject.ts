import {
  projectsApi,
  ListProjectsApiResponse,
  ListProjectsItemModel,
  gqlApi,
  GetProjectsQuery,
  GetProjectsQueryVariables,
  GetProjectUsedTagsQuery,
  ProjectFragmentFragment,
} from '@shared/api/generated'

import {
  DefinitionsFromApi,
  FetchBaseQueryError,
  OverrideResultType,
  QueryStatus,
  TagTypesFromApi,
} from '@reduxjs/toolkit/query'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { parseJSONField } from '../overview'
import { normalizeQueryError } from '@shared/api/base/queryError'
type Definitions = DefinitionsFromApi<typeof projectsApi>
type TagTypes = TagTypesFromApi<typeof projectsApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getProject'> & {
  listProjects: OverrideResultType<Definitions['listProjects'], ListProjectsItemModel[]>
}

const enhancedProject = projectsApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getProject: {
      providesTags: (_res, _error, { projectName }) => [{ type: 'project', id: projectName }],
    },
    listProjects: {
      transformResponse: (res: ListProjectsApiResponse) => res?.projects || [],
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
type GQLUpdatedDefinitions = Omit<GQLDefinitions, 'GetProjects' | 'GetProjectUsedTags'> & {
  GetProjects: OverrideResultType<GQLDefinitions['GetProjects'], GetProjectsResult>
  GetProjectUsedTags: OverrideResultType<GQLDefinitions['GetProjectUsedTags'], string[]>
}
// keep high until ayon-backend#1109: a page shortened by access filtering looks like the last page
export const PROJECTS_PER_PAGE = 2000

// enhance graphql
const enhancedGraphql = gqlApi.enhanceEndpoints<TagTypes, GQLUpdatedDefinitions>({
  endpoints: {
    GetProjects: {
      transformResponse: (res: GetProjectsQuery): GetProjectsResult => ({
        projects: res.projects.edges.map((edge) => ({
          ...edge.node,
          attrib: parseJSONField(edge.node.allAttrib),
        })),
        pageInfo: res.projects.pageInfo,
      }),
    },
    // tags on any entity of the project, including ones that are not in the anatomy.
    // A slow query, so it is kept for a while; saved tags are added by addProjectUsedTags
    GetProjectUsedTags: {
      transformResponse: (res: GetProjectUsedTagsQuery) => res.project.usedTags,
      providesTags: (_res, _error, { projectName }) => [
        { type: 'project', id: usedTagsCacheId(projectName) },
      ],
      keepUnusedDataFor: 30 * 60,
    },
  },
})

const usedTagsCacheId = (projectName: string) => `${projectName}-usedTags`

type ProjectsPageParam = { cursor: string; first?: number }

export const getProjectsGraphql = enhancedGraphql.injectEndpoints({
  endpoints: (build) => ({
    getProjectsInfinite: build.infiniteQuery<
      GetProjectsResult,
      Omit<GetProjectsQueryVariables, 'first' | 'after'>,
      ProjectsPageParam
    >({
      infiniteQueryOptions: {
        initialPageParam: { cursor: '', first: PROJECTS_PER_PAGE },
        getNextPageParam: (lastPage) => {
          const { pageInfo } = lastPage
          if (!pageInfo.hasNextPage || !pageInfo.endCursor) return undefined
          return {
            cursor: pageInfo.endCursor,
            first: PROJECTS_PER_PAGE,
          }
        },
      },
      queryFn: async ({ queryArg, pageParam }, api) => {
        try {
          const queryParams: GetProjectsQueryVariables = {
            ...queryArg,
            after: pageParam?.cursor || undefined,
            first: pageParam?.first,
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
          return { error: normalizeQueryError(e) }
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

export const { useGetProjectsInfiniteInfiniteQuery, useGetProjectUsedTagsQuery } =
  getProjectsGraphql

// called once tags are saved on entities: adds them to the loaded used tags, and refetches the
// list when a request for it is still running, as its answer may not have them yet
export const addProjectUsedTags = (
  projectName: string | undefined,
  tags: string[],
  { dispatch, getState }: { dispatch: ThunkDispatch<any, any, UnknownAction>; getState: () => any },
) => {
  if (!projectName || !tags.length) return
  const entry = getProjectsGraphql.endpoints.GetProjectUsedTags.select({ projectName })(getState())
  if (entry.data) {
    dispatch(
      getProjectsGraphql.util.updateQueryData('GetProjectUsedTags', { projectName }, (draft) => {
        for (const tag of tags) if (!draft.includes(tag)) draft.push(tag)
      }),
    )
  }
  if (entry.status === QueryStatus.pending) {
    dispatch(
      getProjectsGraphql.util.invalidateTags([
        { type: 'project', id: usedTagsCacheId(projectName) },
      ]),
    )
  }
}

export default enhancedProject
