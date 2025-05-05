// enhanced the project query so it can be added to redux store
// We need to do this outside of shared

import { projectsApi } from '@shared/api'
import { selectProject, setProjectData } from '@state/project'

projectsApi.enhanceEndpoints({
  endpoints: {
    getProject: {
      async onCacheEntryAdded(arg, { cacheDataLoaded, getCacheEntry, dispatch }) {
        try {
          // set redux project state name
          dispatch(selectProject(arg.projectName))
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded
          // get redux project state
          const project = getCacheEntry().data as any
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
          const transformArrayToObject = (array: any[], type: OrderType) => {
            const initialValue = {}
            return array.reduce((obj, item: any) => {
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
  },
})

export const { useGetProjectQuery } = projectsApi
