import { OperationModel, api as operationsApi } from '@api/rest/operations'
import tasksApi from '@queries/overview/getOverview'
import hierarchyApi from '@queries/getHierarchy'
import { getEntityPanelApi } from '@queries/entity/getEntityPanel'
import { RootState } from '@reduxjs/toolkit/query'
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
// import { current } from '@reduxjs/toolkit'
// these operations are dedicated to the overview page
// this mean cache updates are custom for the overview page here

// Helper function to update entities with operation data
const updateEntityWithOperation = (entity: any, operationData: any) => {
  const newData = {
    ...entity,
    ...operationData,
    attrib: {
      ...entity.attrib,
      ...(operationData?.attrib || {}),
    },
  }

  // patch data onto the entity
  Object.assign(entity, newData)
}

export const patchOverviewTasks = (
  tasks: OperationModel[],
  {
    state,
    dispatch,
  }: {
    state: RootState<any, any, 'restApi'>
    dispatch: ThunkDispatch<any, any, UnknownAction>
  },
  patches?: any[],
) => {
  const tags = [
    { type: 'overviewTask', id: 'LIST' },
    ...tasks.map((op) => ({ type: 'overviewTask', id: op.entityId })),
  ]
  const taskEntries = tasksApi.util.selectInvalidatedBy(state, tags)
  // console.log({ taskEntries })

  for (const entry of taskEntries) {
    // this updates the main overview cache task
    // it also updates any GetTasksByParent caches
    const tasksPatch = dispatch(
      tasksApi.util.updateQueryData(
        entry.endpointName as 'getOverviewTasksByFolders' | 'GetTasksByParent' | 'GetTasksList',
        entry.originalArgs,
        (draft) => {
          // Apply each change to matching tasks in the cache
          for (const taskOperation of tasks) {
            // Check if draft is an array or an object with a tasks property
            if (Array.isArray(draft)) {
              // Handle array case (like in getOverviewTasksByFolders)
              const task = draft.find((task) => task.id === taskOperation.entityId)
              if (task) {
                updateEntityWithOperation(task, taskOperation.data)
              }
            } else if (draft.tasks && Array.isArray(draft.tasks)) {
              // Handle object with tasks array case (like in GetTasksList)
              const task = draft.tasks.find((task) => task.id === taskOperation.entityId)
              console.log({ task })
              if (task) {
                updateEntityWithOperation(task, taskOperation.data)
              }
            }
          }
        },
      ),
    )
    // add the patch to the list of patches
    patches?.push(tasksPatch)
  }
}

export const patchOverviewFolders = (
  folders: OperationModel[],
  {
    state,
    dispatch,
  }: {
    state: RootState<any, any, 'restApi'>
    dispatch: ThunkDispatch<any, any, UnknownAction>
  },
  patches?: any[],
) => {
  const folderEntries = hierarchyApi.util
    .selectInvalidatedBy(
      state,
      folders.map((op) => ({ type: 'folder', id: op.entityId })),
    )
    .filter((entry) => entry.endpointName === 'getFolderList')
  for (const entry of folderEntries) {
    const folderPatch = dispatch(
      hierarchyApi.util.updateQueryData(
        entry.endpointName as 'getFolderList',
        entry.originalArgs,
        (draft) => {
          // Apply each change to matching folders in the cache
          for (const folderOperation of folders) {
            const folder = draft.folders.find((el) => el.id === folderOperation.entityId)
            if (folder) {
              updateEntityWithOperation(folder, folderOperation.data)
            }
          }
        },
      ),
    )
    //   add the patch to the list of patches
    patches?.push(folderPatch)
  }
}

const patchDetailsPanelEntity = (operations: OperationModel[] = [], draft: any) => {
  // find the entity we are updating from the draft
  const data = operations.find(
    // @ts-ignore - we know draft has an id
    (op) => op.entityId === draft?.id,
  )?.data as any

  if (!data) return

  // if the data has an assignees field, convert it to users field for the details panel
  // Why did we (luke) call it users on the details panel???
  if (data?.assignees) {
    data.users = data.assignees
    delete data.assignees
  }

  // patch the entity
  updateEntityWithOperation(draft, data)
}

const operationsEnhanced = operationsApi.enhanceEndpoints({
  endpoints: {
    operations: {
      async onQueryStarted({ operationsRequestModel }, { dispatch, queryFulfilled, getState }) {
        if (!operationsRequestModel.operations?.length) return
        // we need to split the operations by entity type
        const operationsByType = operationsRequestModel.operations.reduce(
          (acc: Record<OperationModel['entityType'], OperationModel[]>, operation) => {
            acc[operation.entityType].push(operation)
            return acc
          },
          {
            task: [],
            folder: [],
            product: [],
            version: [],
            representation: [],
            workfile: [],
          },
        )

        // collect patches incase we need to undo them
        const state = getState()
        const patches: any[] = []

        // patch the overview tasks
        if (operationsByType.task?.length) {
          patchOverviewTasks(operationsByType.task, { state, dispatch }, patches)
        }

        // patch the overview folders (any any other folders from foldersList)
        if (operationsByType.folder?.length) {
          patchOverviewFolders(operationsByType.folder, { state, dispatch }, patches)
        }

        // try to patch any details panels
        // first we patch the individual entities
        // then we patch the details panel cache
        const entityTags = operationsRequestModel.operations.map((op) => ({
          id: op.entityId,
          type: op.entityType,
        }))
        const entitiesTags = entityTags.map((tag) => ({
          type: 'entities',
          id: tag.id,
        }))

        // invalidates the details panel cache so that it fetches all individual entities again (using it's updated cache)
        const invalidateEntryPanel = () =>
          dispatch(getEntityPanelApi.util.invalidateTags(entitiesTags))

        // the individual entities that are patched for the details panel
        // remember the details panel cache is made up of individual entity caches
        const detailsPanelEntityCaches = getEntityPanelApi.util.selectInvalidatedBy(
          state,
          entityTags,
        )

        for (const entry of detailsPanelEntityCaches) {
          // only patch the getEntityDetailsPanel cache
          if (entry.endpointName !== 'getEntityDetailsPanel') continue
          const entityDetailsResult = dispatch(
            getEntityPanelApi.util.updateQueryData(
              'getEntityDetailsPanel',
              entry.originalArgs,
              (draft) => {
                patchDetailsPanelEntity(operationsRequestModel.operations, draft)
              },
            ),
          )
          // add the patch to the list of patches
          patches.push(entityDetailsResult)
        }

        // the cache for the whole details panel
        const detailsPanelEntitiesCaches = getEntityPanelApi.util.selectInvalidatedBy(
          state,
          entitiesTags,
        )

        for (const entry of detailsPanelEntitiesCaches) {
          if (entry.endpointName !== 'getEntitiesDetailsPanel') continue
          const entitiesDetailsResult = dispatch(
            getEntityPanelApi.util.updateQueryData(
              entry.endpointName as 'getEntitiesDetailsPanel',
              entry.originalArgs,
              (draft) => {
                for (const entity of draft) {
                  patchDetailsPanelEntity(operationsRequestModel.operations, entity)
                }
              },
            ),
          )

          // add the patch to the list of patches
          patches.push(entitiesDetailsResult)
        }

        try {
          await queryFulfilled
        } catch (error) {
          // undo all patches if there is an error
          for (const patch of patches) {
            patch.undo()
          }

          if (detailsPanelEntityCaches.length) {
            // we invalidate the tags for the detailsPanelEntityCaches that were patched
            // invalidate the details panel cache
            invalidateEntryPanel()
          }
        }
      },
    },
  },
})

export const { useOperationsMutation } = operationsEnhanced
