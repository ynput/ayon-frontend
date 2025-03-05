import {
  api,
  ListProjectsApiResponse,
  FolderType,
  GetProjectApiResponse,
  Status,
  TaskType,
} from '@api/rest/project'
// @ts-ignore
import { selectProject, setProjectData } from '@state/project'
import { TagTypes, UpdatedDefinitions } from './ProjectTypes'

// TODO: use graphql api and write custom types
// We will need to inject the endpoint as it cannot be generated
const createProjectQuery = (attribs: $Any, fields: $Any) => {
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

const getProjectInjected = api.injectEndpoints({
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

import { $Any } from '@/types'

interface GetProjectApiResponseExtended extends GetProjectApiResponse {
  folderTypes: FolderType[]
  taskTypes: TaskType[]
  statuses: Status[]
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof getProjectInjected>
type TagTypes = TagTypesFromApi<typeof getProjectInjected>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getProject'> & {
  getProject: OverrideResultType<Definitions['getProject'], GetProjectApiResponseExtended>
}

// TODO: sort out the types
const getProjectApi = getProjectInjected.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getProject: {
      transformErrorResponse: (error: $Any) => error.data.detail || `Error ${error.status}`,
      providesTags: (_res, _error, { projectName }) => [{ type: 'project', id: projectName }],
      async onCacheEntryAdded(arg, { cacheDataLoaded, getCacheEntry, dispatch }) {
        try {
          // set redux project state name
          dispatch(selectProject(arg.projectName))
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded
          // get redux project state
          const project = getCacheEntry().data as $Any
          // an array of strings for the order of each list type
          const order: {
            tasks: string[]
            folders: string[]
            statuses: string[]
            tags: string[]
          } = {
            tasks: [],
            folders: [],
            statuses: [],
            tags: [],
          }

          type OrderType = keyof typeof order

          // function: transforms and array into an object with the array item's name as the key using for loop
          const transformArrayToObject = (array: $Any[], type: OrderType) => {
            const initialValue = {}
            return array.reduce((obj, item: $Any) => {
              order[type].push(item.name)
              return {
                ...obj,
                [item.name]: item,
              }
            }, initialValue)
          }

          const tasks = transformArrayToObject(project?.taskTypes, 'tasks')
          const folders = transformArrayToObject(project?.folderTypes, 'folders')
          const statuses = transformArrayToObject(project?.statuses, 'statuses')
          const tags = transformArrayToObject(project?.tags, 'tags')
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
      transformResponse: (res: ListProjectsApiResponse) => res?.projects || [],
      transformErrorResponse: (error: $Any) => error.data.detail || `Error ${error.status}`,
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
