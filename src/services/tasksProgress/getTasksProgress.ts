// What data do we need?

import api from '@api'
import { GetTasksProgressQuery } from '@api/graphql'

type ProgressFolder = GetTasksProgressQuery['project']['folders']['edges'][0]['node']
type ProgressTask = ProgressFolder['tasks']['edges'][0]['node']

interface GetTasksProgress extends Omit<ProgressFolder, 'tasks'> {
  tasks: ProgressTask[]
}

export type GetTasksProgressResult = GetTasksProgress[]

const transformTasksProgress = (data: GetTasksProgressQuery): GetTasksProgressResult => {
  const foldersWithTasks = data.project.folders.edges.map((folder) => {
    const tasks = folder.node.tasks.edges.map((task) => task.node)
    return {
      ...folder.node,
      tasks,
    }
  })

  return foldersWithTasks
}

const provideTagsTasksProgress = (result: GetTasksProgressResult | undefined) => {
  if (!result) return []
  const folderTags = result.map((folder) => ({ id: folder.id, type: 'folder' }))
  const taskTags = result.flatMap((folder) =>
    folder.tasks.map((task) => ({ id: task.id, type: 'task' })),
  )

  return [...folderTags, ...taskTags]
}

import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'GetTasksProgress'> & {
  GetTasksProgress: OverrideResultType<Definitions['GetTasksProgress'], GetTasksProgressResult>
}

const enhancedEndpoints = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetTasksProgress: {
      transformResponse: transformTasksProgress,
      providesTags: provideTagsTasksProgress,
    },
  },
})

export const { useGetTasksProgressQuery } = enhancedEndpoints
