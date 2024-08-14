// What data do we need?

import api from '@api'
import { GetTasksProgressQuery } from '@api/graphql'

export type ProgressTask = GetTasksProgressQuery['project']['tasks']['edges'][0]['node']

interface GetTasksProgress {
  name: string
  id: string
  projectName: string
  tasks: ProgressTask[]
}

export type GetTasksProgressResult = GetTasksProgress[]

const transformTasksProgress = (data: GetTasksProgressQuery): GetTasksProgressResult => {
  const groupedTasks: {
    [key: string]: {
      id: string
      name: string
      projectName: string
      tasks: ProgressTask[]
    }
  } = {}

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

// {
//   "projectName": "AY_CG_demo",
//   "folderIds": [
//     "ac3374ea3c6858efbbc609d3ac83c9fa"
//   ]
// }
