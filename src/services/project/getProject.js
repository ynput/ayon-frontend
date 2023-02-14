import { ayonApi } from '../ayon'
import { selectProject, setProjectData } from '/src/features/project'

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

const PROJECT_LATEST_QUERY = `
query Project($projectName: String!) {
  project(name: $projectName) {
    name

  }
}
`

const getProject = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProject: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}`,
        method: 'GET',
      }),
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: (res, error, { projectName }) => [{ type: 'project', name: projectName }],
      async onCacheEntryAdded(arg, { cacheDataLoaded, getCacheEntry, dispatch }) {
        try {
          // set redux project state name
          dispatch(selectProject(arg.projectName))
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          // get redux project state
          const project = getCacheEntry().data

          // an array of strings for the order of each list type
          const order = {
            tasks: [],
            folders: [],
            statuses: [],
            tags: [],
          }
          // function: transforms and array into an object with the array item's name as the key using for loop
          const transformArrayToObject = (array, type) => {
            const initialValue = {}
            return array.reduce((obj, item) => {
              order[type].push(item.name)
              return {
                ...obj,
                [item.name]: item,
              }
            }, initialValue)
          }

          const tasks = transformArrayToObject(project.taskTypes, 'tasks')
          const folders = transformArrayToObject(project.folderTypes, 'folders')
          const statuses = transformArrayToObject(project.statuses, 'statuses')
          const tags = transformArrayToObject(project.tags, 'tags')
          // const families = transformArrayToObject(project.families, 'name')

          // set project state
          dispatch(setProjectData({ tasks, folders, statuses, tags, order }))
        } catch (error) {
          console.error(error)
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
      },
    }),
    getAllProjects: build.query({
      query: () => ({
        url: `/api/projects`,
        method: 'GET',
      }),
      transformResponse: (res) => res.projects,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
      providesTags: () => ['project', 'projects'],
    }),
    getProjectAnatomy: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/anatomy`,
      }),
      providesTags: (res, error, { projectName }) => [{ type: 'project', name: projectName }],
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
      providesTags: (res, error, { projectName }) => [{ type: 'project', name: projectName }],
    }),
    getProjectLatest: build.query({
      query: ({ projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: PROJECT_LATEST_QUERY,
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
  useGetProjectLatestQuery,
} = getProject
