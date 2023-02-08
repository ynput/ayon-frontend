import { ayonApi } from './ayon'

const createProjectQuery = (attribs, fields) => {
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

const getProject = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProject: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}`,
        method: 'GET',
      }),
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: () => ['project'],
    }),
    getAllProjects: build.query({
      query: () => ({
        url: `/api/projects`,
        method: 'GET',
      }),
      transformResponse: (res) => res.projects,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: () => ['project'],
    }),
    getProjectAnatomy: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/anatomy`,
      }),
    }),
    getProjectAttribs: build.query({
      query: ({ projectName, attribs = [], fields = [] }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: createProjectQuery(attribs, fields),
          variables: { projectName },
        },
      }),
      transformResponse: (res) => res.data?.project,
    }),
  }),
})

export const {
  useGetProjectQuery,
  useGetAllProjectsQuery,
  useGetProjectAnatomyQuery,
  useGetProjectAttribsQuery,
} = getProject
