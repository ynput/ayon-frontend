import api from '@api'
import {
  FolderNode,
  GetEntitiesByIdsQuery,
  GetFilteredEntitiesByParentQuery,
  TaskNode,
} from '@api/graphql'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

const transformFilteredEntities = (
  response: GetEntitiesByIdsQuery,
): GetEntitiesByIdsResult => {
  let folders: { [key: string]: Partial<FolderNode> } = {}
  let tasks: { [key: string]: Partial<TaskNode> } = {}

  if (!response.project) {
    return { folders: {}, tasks: {} }
  }

  // Add folders
  for (const { node } of response.project.folders.edges) {
    folders[node.id] = {
      ...node,
      parentId: node.parentId || 'root',
    }
  }
  for (const { node: taskNode } of response.project.tasks.edges) {
    tasks[taskNode.id] = {
      ...taskNode,
      folderId: taskNode.folderId || 'root',
    }
  }

  return { folders, tasks }
}

const transformFilteredEntitiesByParent = (
  response: GetFilteredEntitiesByParentQuery,
): GetFilteredEntitiesByParentResult => {
  let folders: { [key: string]: Partial<FolderNode> } = {}
  let tasks: { [key: string]: Partial<TaskNode> } = {}

  if (!response.project) {
    return { folders: {}, tasks: {} }
  }

  // Add folders
  for (const { node } of response.project.folders.edges) {
    folders[node.id] = {
      ...node,
      parentId: node.parentId || 'root',
    }
  }
  for (const { node: taskNode } of response.project.tasks.edges) {
    tasks[taskNode.id] = {
      ...taskNode,
      folderId: taskNode.folderId || 'root',
    }
  }

  return { folders, tasks }
}

type GetEntitiesByIdsResult = {
  folders: { [key: string]: Partial<FolderNode> }
  tasks: { [key: string]: Partial<TaskNode> }
}
type GetFilteredEntitiesByParentResult = {
  folders: { [key: string]: Partial<FolderNode> }
  tasks: { [key: string]: Partial<TaskNode> }
}

type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>
type UpdatedDefinitions = Omit<Definitions, 'GetFilteredEntities'> & {
  GetEntitiesByIds: OverrideResultType<
    Definitions['GetEntitiesByIds'],
    GetEntitiesByIdsResult
  >
  GetFilteredEntitiesByParent: OverrideResultType<
    Definitions['GetFilteredEntitiesByParent'],
    GetFilteredEntitiesByParentResult
  >
}

const enhancedApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    GetEntitiesByIds: {
      transformResponse: transformFilteredEntities,
    },
    GetFilteredEntitiesByParent: {
      transformResponse: transformFilteredEntitiesByParent,
    },
  },
})

export const { useGetEntitiesByIdsQuery, useGetFilteredEntitiesByParentQuery } = enhancedApi
