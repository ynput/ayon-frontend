// What data do we need?
import {
  createRealtimeBatcher,
  getSupportedEntityPatch,
  PubSub,
  REALTIME_REST_CALL_LIMIT,
  subscribeToThumbnailUpdates,
  ThumbnailUpdateMessage,
  waitForRealtimeJitter,
} from '@shared/util'
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

const supportedTaskFields = ['status', 'tags', 'assignees', 'taskType'] as const
type SupportedTaskField = (typeof supportedTaskFields)[number]

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

  return [...folderTags, ...taskTags, ...progressTags, { type: 'progress', id: 'LIST' }]
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
        let unsubscribeThumbnails: (() => void) | undefined
        const batchProcessMessages = async (messages: { topic: string; message: any }[]) => {
          const cachedTaskIds = new Set(
            getCacheEntry().data?.flatMap((folder) => folder.tasks.map((task) => task.id)) || [],
          )
          const deletedIds = new Set<string>()
          const taskIdsToFetch = new Set<string>()
          const patches: {
            taskId: string
            field: SupportedTaskField
            value: string | string[]
          }[] = []

          messages.forEach(({ topic, message }) => {
            if (message.project !== projectName) return

            const taskId = message.summary?.entityId
            if (!taskId) return

            if (topic === 'entity.task.deleted') {
              deletedIds.add(taskId)
              return
            }

            const isCreated = topic === 'entity.task.created'
            if (!isCreated && !cachedTaskIds.has(taskId)) return

            if (isCreated) {
              taskIdsToFetch.add(taskId)
              return
            }

            const field = topic.split('.')[2]?.replace('_changed', '')
            const patch = getSupportedEntityPatch(field, message.summary, supportedTaskFields)
            if (patch) {
              patches.push({
                taskId,
                field: patch.field as SupportedTaskField,
                value: patch.value,
              })
            } else {
              taskIdsToFetch.add(taskId)
            }
          })

          if (deletedIds.size) {
            updateCachedData((draft) => {
              draft.forEach((folder) => {
                folder.tasks = folder.tasks.filter((task) => !deletedIds.has(task.id))
              })
            })
          }

          if (patches.length) {
            updateCachedData((draft) => {
              patches.forEach(({ taskId, field, value }) => {
                draft.forEach((folder) => {
                  const task = folder.tasks.find((item) => item.id === taskId)
                  if (task) Object.assign(task, { [field]: value })
                })
              })
            })
          }

          const idsToFetch = Array.from(taskIdsToFetch)
          if (!idsToFetch.length || idsToFetch.length > REALTIME_REST_CALL_LIMIT) return

          await waitForRealtimeJitter()
          const results = await Promise.all(
            idsToFetch.map((taskId) =>
              dispatch(
                gqlApi.endpoints.GetProgressTask.initiate(
                  { projectName, taskId },
                  { forceRefetch: true },
                ),
              ),
            ),
          )
          const updatedTasks = results
            .filter((result) => result.status === 'fulfilled' && result.data)
            .map((result) => result.data as unknown as GetProgressTaskResult)
            .filter((task): task is ProgressTask => Boolean(task))

          if (!updatedTasks.length) return

          updateCachedData((draft) => {
            updatedTasks.forEach((updatedTask) => {
              const folder = draft.find((item) => item.id === updatedTask.folder.id)
              if (!folder) return

              const taskIndex = folder.tasks.findIndex((task) => task.id === updatedTask.id)
              if (taskIndex === -1) folder.tasks.push(updatedTask)
              else folder.tasks[taskIndex] = updatedTask
            })
          })
        }
        const batcher = createRealtimeBatcher(
          batchProcessMessages,
          ({ message }) => message.summary?.entityId,
        )
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          unsubscribeThumbnails = subscribeToThumbnailUpdates(
            (messages: ThumbnailUpdateMessage[]) => {
              const draftData = getCacheEntry().data
              if (!draftData?.length) return

              const relevantMessages = messages.filter((m) => m.project === projectName)
              if (!relevantMessages.length) return

              updateCachedData((draft) => {
                relevantMessages.forEach((message) => {
                  if (message.summary.entityType === 'task') {
                    draft.forEach((folder) => {
                      const taskIndex = folder.tasks.findIndex(
                        (t) => t.id === message.summary.entityId,
                      )
                      if (taskIndex !== -1) {
                        folder.tasks[taskIndex].thumbnailHash = message.summary.thumbnailHash || ''
                      }
                    })
                  } else if (message.summary.entityType === 'folder') {
                    const folderIndex = draft.findIndex((f) => f.id === message.summary.entityId)
                    if (folderIndex !== -1) {
                      draft[folderIndex].thumbnailHash = message.summary.thumbnailHash || ''
                    }
                  }
                })
              })
            },
            ['task', 'folder'],
          )

          const handlePubSub = (topic: string, message: any) => {
            if (!message?.summary?.entityId) return
            batcher.add({ topic, message })
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
        batcher.clear()
        PubSub.unsubscribe(token)
        if (unsubscribeThumbnails) {
          unsubscribeThumbnails()
        }
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
