import { api, detailsPanelQueries } from '@shared/api'
import { DetailsPanelEntityData, DetailsPanelEntityType } from './transformDetailsPanelData'
import { RootState } from '@reduxjs/toolkit/query'
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { PatchOperation } from '../overview/updateOverview'

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

const operationDataToDetailsData = (
  data: Record<string, any>,
  entityType: DetailsPanelEntityType,
): DeepPartial<DetailsPanelEntityData> => {
  const sharedData: DeepPartial<DetailsPanelEntityData> = {
    name: data.name,
    attrib: data.attrib,
    status: data.status,
    tags: data.tags,
    label: data.label,
    updatedAt: data.updatedAt,
    createdAt: data.createdAt,
    hasReviewables: data.hasReviewables,
    thumbnailId: data.thumbnailId,
  }

  switch (entityType) {
    case 'task':
      return {
        ...sharedData,
        task: {
          assignees: data.assignees,
          label: data.label,
          name: data.name,
          taskType: data.taskType,
          subtasks: data.subtasks,
        },
      }
    case 'folder':
      return {
        ...sharedData,
        folder: {
          id: data.id,
          name: data.name,
          label: data.label,
          folderType: data.folderType,
        },
      }
    case 'version':
      return {
        ...sharedData,
        version: {
          id: data.id,
          name: data.name,
        },
      }
    case 'representation':
      return {
        ...sharedData,
      }
  }
}

export const patchDetailsPanelEntity = (
  operations: PatchOperation[] = [],
  draft: DetailsPanelEntityData,
) => {
  // find the entity we are updating from the draft
  const operation = operations.find((op) => op.entityId === draft.id)
  const operationData = operation?.data

  if (!operationData || operation.entityType === 'product' || operation.entityType === 'workfile')
    return console.warn('No operation data found or entity type not supported')

  // transform the data to match the details panel entity data
  const detailsPanelData = operationDataToDetailsData(operationData, operation.entityType)

  // If this is a folder and name is being updated, also update the path
  if (operation.entityType === 'folder' && operationData.name && draft.path) {
    // Construct new path by replacing the last segment with the new name
    const pathParts = draft.path.split('/')
    pathParts[pathParts.length - 1] = operationData.name
    detailsPanelData.path = pathParts.join('/')
  }

  // helper to deep‐clean undefined values
  function cleanUndefined(obj: any): void {
    Object.entries(obj).forEach(([key, val]) => {
      if (val === undefined) {
        delete obj[key]
      } else if (val !== null && typeof val === 'object') {
        cleanUndefined(val)
      }
    })
  }

  // remove all undefineds at root and nested levels
  cleanUndefined(detailsPanelData as Record<string, any>)

  const newData: DeepPartial<DetailsPanelEntityData> = {
    ...draft,
    ...detailsPanelData,
    attrib: {
      ...(draft?.attrib || {}),
      ...detailsPanelData.attrib,
    },
    folder: {
      ...(draft?.folder || {}),
      ...detailsPanelData.folder,
    },
    task: {
      ...(draft?.task || {}),
      ...detailsPanelData.task,
    },
    version: {
      ...(draft?.version || {}),
      ...detailsPanelData.version,
    },
  }

  // patch data onto the entity
  Object.assign(draft, newData)
}

/**
 * Patches the details panel cache with the provided operations.
 *
 * @param operations - The operations to apply to the details panel cache.
 * @param options - Configuration options for patching.
 * @param options.state - The current state of the store.
 * @param options.dispatch - The dispatch function to update the store.
 * @param patches - An optional array to collect the resulting patch results.
 */
export const patchDetailsPanel = (
  operations: PatchOperation[],
  {
    state,
    dispatch,
  }: {
    state: RootState<any, any, any>
    dispatch: ThunkDispatch<any, any, any>
  },
  patches?: any[],
) => {
  const detailsPanelTags = operations.map((op) => ({
    type: 'entities',
    id: op.entityId,
  }))

  const detailsPanelEntries = api.util.selectInvalidatedBy(state, detailsPanelTags)

  for (const entry of detailsPanelEntries) {
    if (entry.endpointName === 'getEntitiesDetailsPanel') {
      const entityDetailsResult = dispatch(
        detailsPanelQueries.util.updateQueryData(
          'getEntitiesDetailsPanel',
          entry.originalArgs,
          (draft) => {
            for (const entity of draft) {
              patchDetailsPanelEntity(operations, entity)
            }
          },
        ),
      )

      if (entityDetailsResult) {
        patches?.push(entityDetailsResult)
      }
    }
  }
}
