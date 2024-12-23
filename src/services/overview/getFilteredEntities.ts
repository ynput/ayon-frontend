import api from '@api'
import { FolderNode, GetFilteredEntitiesQuery, TaskNode } from '@api/graphql'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

const transformFilteredEntities = (
  response: GetFilteredEntitiesQuery,
): GetFilteredEntitiesResult => {
  let folders: { [key: string]: Partial<FolderNode>  } = {}
  let tasks: { [key: string]: Partial<TaskNode>  } = {}

  if (!response.project) {
    return { folders: {}, tasks: {} }
  }

  // Add folders
  for (const { node } of response.project.folders.edges) {
    const { tasks, ...partialNode } = node
    folders[node.id] = {
      ...partialNode,
      parentId: node.parentId || 'root',
    }
    for (const { node: taskNode } of node.tasks.edges) {
      // @ts-ignore
      tasks[taskNode.id ] = {
        ...taskNode,
        folderId: taskNode.folderId || 'root',
      }
    }
  }

  return { folders, tasks}
}

type GetFilteredEntitiesResult = { folders: {[key: string]: Partial<FolderNode>}, tasks: {[key: string]: Partial<TaskNode>} }

type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
type UpdatedDefinitions = Omit<Definitions, 'GetFilteredEntities'> & {
GetFilteredEntities: OverrideResultType<Definitions['GetFilteredEntities'], GetFilteredEntitiesResult>
}

const enhancedApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetFilteredEntities: {
      transformResponse: transformFilteredEntities,
    },
  },
})

export const { useGetFilteredEntitiesQuery } = enhancedApi
