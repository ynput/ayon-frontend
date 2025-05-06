// What data do we need?
import { PubSub } from '@shared/util'
import { gqlApi } from '@shared/api'
import { GetProgressTaskQuery, GetTasksProgressQuery } from '@shared/api'

export type ProgressTask = GetTasksProgressQuery['project']['tasks']['edges'][0]['node']

export type ProgressTaskFolder = ProgressTask['folder']
export interface FolderGroup extends ProgressTaskFolder {
  projectName: string
  tasks: ProgressTask[]
}

export type GetTasksProgressResult = FolderGroup[]
export type GetProgressTaskResult = ProgressTask | null | undefined

type GroupedTasksType = {
  [key: string]: FolderGroup
}

const transformTasksProgress = (data: GetTasksProgressQuery): GetTasksProgressResult => {
  const groupedTasks: GroupedTasksType = {}

  data.project.tasks.edges.forEach((edge) => {
    const folder = edge.node.folder
    if (!groupedTasks[folder.id]) {
      groupedTasks[folder.id] = {
        ...folder,
        projectName: edge.node.projectName,
        tasks: [],
      }
    }
    groupedTasks[folder.id].tasks.push({
      ...edge.node,
    })
  })

  const foldersWithTasks = Object.values(groupedTasks)

  return foldersWithTasks
}

const provideTagsTasksProgress = (result: GetTasksProgressResult | undefined) => {
  if (!result) return []
  const folderTags = result.map((folder) => ({ id: folder.id, type: 'folder' }))
  const taskTags = result.flatMap((folder) =>
    folder.tasks.map((task) => ({ id: task.id, type: 'task' })),
  )
  // progress tags
  const progressTags = [...folderTags, ...taskTags].map((tag) => ({ id: tag.id, type: 'progress' }))

  return [...folderTags, ...taskTags, ...progressTags]
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof gqlApi>
type TagTypes = TagTypesFromApi<typeof gqlApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetTasksProgress' | 'GetProgressTask'> & {
  GetTasksProgress: OverrideResultType<Definitions['GetTasksProgress'], GetTasksProgressResult>
  GetProgressTask: OverrideResultType<Definitions['GetProgressTask'], GetProgressTaskResult>
}

const enhancedEndpoints = gqlApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetTasksProgress: {
      transformResponse: transformTasksProgress,
      providesTags: provideTagsTasksProgress,
      async onCacheEntryAdded(
        { projectName },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = async (topic: string, message: any) => {
            console.log('PubSub message received', message)
            const matchingProject = message.project === projectName

            if (!matchingProject)
              return console.log('Message not relevant, does not match the current project')

            const tasksProgressCache = getCacheEntry().data

            // create a lookup set of all tasks
            const allTasks = new Set<string>()
            tasksProgressCache?.forEach((folder) => {
              folder.tasks.forEach((task) => {
                allTasks.add(task.id)
              })
            })

            const messageTaskId = message.summary?.entityId
            const matchedTask = allTasks.has(messageTaskId)
            const createdTask = topic.includes('created')

            // check if the message is relevant to the current query
            if (!matchedTask && !createdTask)
              return console.log('Message not relevant, does not match any taskIds')

            try {
              // if the topic is deleted then remove the task from the cache
              if (topic.includes('deleted')) {
                updateCachedData((draft) => {
                  if (!draft) return
                  // find the folder to remove the task from
                  for (const folder of draft) {
                    const taskIndex = folder.tasks.findIndex((task) => task.id === messageTaskId)
                    if (taskIndex !== -1) {
                      folder.tasks.splice(taskIndex, 1)
                      break // stop the loop once the task is found and removed
                    }
                  }
                })
                // do nothing else
                return
              }

              // get the new data for the entity
              const res = await dispatch(
                gqlApi.endpoints.GetProgressTask.initiate(
                  {
                    projectName: projectName,
                    taskId: messageTaskId,
                  },
                  { forceRefetch: true },
                ),
              )

              // check the res
              if (res.status !== 'fulfilled') {
                console.error(res?.error || 'No task found')
                return
              }

              const updatedTask = res.data as unknown as GetProgressTaskResult
              if (!updatedTask) {
                console.error('No task found')
                return
              }

              updateCachedData((draft) => {
                if (!draft) return
                // find the folder to add the task to
                const folderIndex = draft.findIndex((folder) => folder.id === updatedTask.folder.id)
                if (folderIndex === -1) return
                const foundFolder = draft[folderIndex]
                // find the task to update
                const newTasks = [...foundFolder.tasks]
                const taskIndex = newTasks.findIndex((task) => task.id === updatedTask.id)

                if (taskIndex === -1) {
                  console.log('Task not found in cache, adding it')
                  // add task
                  newTasks.push(updatedTask)
                } else {
                  // update task
                  newTasks[taskIndex] = updatedTask
                }

                // update the folder
                draft[folderIndex] = {
                  ...foundFolder,
                  tasks: newTasks,
                }
              })
            } catch (error) {
              console.error('Entity task realtime update failed', error)
              return
            }
          }

          const topic = `entity.task`
          // sub to websocket topic
          token = PubSub.subscribe(topic, handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    },
    // GetProgressTask: a single task for the tasks progress table
    // used mainly for realtime updates to patch the task in the cache
    GetProgressTask: {
      transformResponse: (result: GetProgressTaskQuery) => result.project.task,
    },
  },
})

export const { useGetTasksProgressQuery } = enhancedEndpoints
