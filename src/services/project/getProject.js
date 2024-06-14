import { ayonApi } from '../ayon'
import { selectProject, setProjectData } from '/src/features/project'

// TODO: use graphql api and write custom types
// We will need to inject the endpoint as it cannot be generated
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
      providesTags: (res, error, { projectName }) => [{ type: 'project', id: projectName }],
    }),
  }),
})

import API from '../../types'

const enhancedApi = API.enhance({
  rest: {
    endpoints: {
      getProject: {
        transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
        providesTags: (res, error, { projectName }) => [{ type: 'project', id: projectName }],
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
            const attrib = project?.attrib || {}
            // set project state
            dispatch(setProjectData({ tasks, folders, statuses, tags, order, attrib }))
          } catch (error) {
            console.error(error)
            // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
            // in which case `cacheDataLoaded` will throw
          }
        },
      },
      listProjects: {
        transformResponse: (res) => res.projects,
        transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
        providesTags: (res, error, { active }) => [
          { type: 'project' },
          { type: 'projects', id: active },
        ],
      },
      getProjectAnatomy: {
        providesTags: (res, error, { projectName }) => [{ type: 'project', id: projectName }],
      },
    },
  },
})

export const { useGetProjectQuery, useListProjectsQuery, useGetProjectAnatomyQuery } =
  enhancedApi.rest

export const { useGetProjectAttribsQuery } = getProject
