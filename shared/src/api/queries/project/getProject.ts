import { projectsApi, ListProjectsApiResponse, ListProjectsItemModel } from '@shared/api/generated'

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof projectsApi>
type TagTypes = TagTypesFromApi<typeof projectsApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getProject'> & {
  listProjects: OverrideResultType<Definitions['listProjects'], ListProjectsItemModel[]>
}

// TODO: sort out the types
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

export const { useGetProjectQuery, useListProjectsQuery, useGetProjectAnatomyQuery } =
  enhancedProject

export default enhancedProject
