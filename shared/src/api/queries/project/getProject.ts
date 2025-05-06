import { projectsApi, ListProjectsApiResponse, ListProjectsItemModel } from '@shared/api/generated'

// TODO: use graphql api and write custom types
// We will need to inject the endpoint as it cannot be generated
const createProjectQuery = (attribs: any, fields: any) => {
  const attribFragment = `
  fragment AttribFragment on ProjectAttribType {
    ${attribs.join(' ')}
  }`

  const fieldsFragment = `
  fragment FieldsFragment on ProjectNode {
    ${fields.join(' ')}
  }`

  return `
  query Project($projectName: String!) {
    project(name: $projectName) {
      ${fields.length ? '...FieldsFragment' : ''}
      ${
        attribs.length
          ? `      attrib {
        ...AttribFragment
      }`
          : ''
      }

    }
  }
  ${fields.length ? fieldsFragment : ''}
  ${attribs.length ? attribFragment : ''}
  `
}

const getProjectInjected = projectsApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectAttribs: build.query({
      query: ({ projectName, attribs = [], fields = [] }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: createProjectQuery(attribs, fields),
          variables: { projectName },
        },
      }),
      transformResponse: (res: any) => res.data?.project,
      providesTags: (_res, _error, { projectName }) => [{ type: 'project', id: projectName }],
    }),
    getTasksFolders: build.query({
      query: ({ projectName, query }) => ({
        url: `/api/projects/${projectName}/tasksFolders`,
        method: 'POST',
        body: {
          ...query,
        },
      }),
      transformResponse: (res: any) => res.folderIds || [],
      providesTags: (_res, _error, { projectName }) => [{ type: 'project', id: projectName }],
    }),
  }),
  overrideExisting: true,
})

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof getProjectInjected>
type TagTypes = TagTypesFromApi<typeof getProjectInjected>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getProject'> & {
  listProjects: OverrideResultType<Definitions['listProjects'], ListProjectsItemModel[]>
}

// TODO: sort out the types
const getProjectApi = getProjectInjected.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getProject: {
      transformErrorResponse: (error: any) => error.data.detail || `Error ${error.status}`,
      providesTags: (_res, _error, { projectName }) => [{ type: 'project', id: projectName }],
    },
    listProjects: {
      transformResponse: (res: ListProjectsApiResponse) => res?.projects || [],
      transformErrorResponse: (error: any) => error.data.detail || `Error ${error.status}`,
      // @ts-ignore
      providesTags: (_res, _error, { active }) => [
        { type: 'project' },
        { type: 'projects', id: active },
        { type: 'projects', id: 'LIST' },
      ],
    },
    getProjectAnatomy: {
      providesTags: (_res, _error, { projectName }) => [{ type: 'project', id: projectName }],
    },
  },
})

export const {
  useGetProjectQuery,
  useListProjectsQuery,
  useGetProjectAnatomyQuery,
  useGetProjectAttribsQuery,
  useGetTasksFoldersQuery,
} = getProjectApi

export default getProjectApi
