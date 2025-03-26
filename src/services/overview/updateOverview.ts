import {
  OperationModel,
  api as operationsApi,
  OperationsApiArg,
  OperationsResponseModel,
} from '@api/rest/operations'
import tasksApi from '@queries/overview/getOverview'
import hierarchyApi from '@queries/getHierarchy'
import { getEntityPanelApi } from '@queries/entity/getEntityPanel'
import { FetchBaseQueryError, RootState } from '@reduxjs/toolkit/query'
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { EditorTaskNode } from '@containers/ProjectTreeTable/utils/types'
import { InheritedDependent } from '@containers/ProjectTreeTable/context/ProjectTableContext'
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

const getOverviewTaskTags = (tasks: Pick<OperationModel, 'entityId'>[]) => {
  return [
    { type: 'overviewTask', id: 'LIST' },
    ...tasks.map((op) => ({ type: 'overviewTask', id: op.entityId })),
  ]
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
  const tags = getOverviewTaskTags(tasks)
  const taskEntries = tasksApi.util.selectInvalidatedBy(state, tags)

  for (const entry of taskEntries) {
    if (entry.endpointName === 'getTasksListInfinite') {
      // patch getTasksListInfinite
      const tasksPatch = dispatch(
        tasksApi.util.updateQueryData('getTasksListInfinite', entry.originalArgs, (draft) => {
          // Apply each change to matching tasks in all pages
          for (const taskOperation of tasks) {
            // Iterate through all pages in the infinite query
            for (const page of draft.pages) {
              const task = page.tasks.find((task) => task.id === taskOperation.entityId)
              if (task) {
                updateEntityWithOperation(task, taskOperation.data)
              }
            }
          }
        }),
      )

      // add the patch to the list of patches
      patches?.push(tasksPatch)
    } else {
      // this updates the main overview cache task
      // it also updates any GetTasksByParent caches
      const tasksPatch = dispatch(
        tasksApi.util.updateQueryData(
          entry.endpointName as 'getOverviewTasksByFolders' | 'GetTasksByParent' | 'GetTasksList',
          entry.originalArgs,
          (draft) => {
            // Apply each change to matching tasks in the cache
            for (const taskOperation of tasks) {
              const patchTask = (tasksArrayDraft: EditorTaskNode[]) => {
                const task = tasksArrayDraft.find((task) => task.id === taskOperation.entityId)
                if (task) {
                  updateEntityWithOperation(task, taskOperation.data)
                }
              }

              // Check if draft is an array or an object with a tasks property
              if (Array.isArray(draft)) {
                patchTask(draft)
              } else if (draft.tasks && Array.isArray(draft.tasks)) {
                // Handle object with tasks array case (like in GetTasksList)
                const draftArray = draft.tasks
                patchTask(draftArray)
              }
            }
          },
        ),
      )
      // add the patch to the list of patches
      patches?.push(tasksPatch)
    }
  }
}

const invalidateOverviewTasks = (
  tasks: Pick<OperationModel, 'entityId'>[],
  {
    dispatch,
  }: {
    dispatch: ThunkDispatch<any, any, UnknownAction>
  },
) => {
  dispatch(tasksApi.util.invalidateTags(getOverviewTaskTags(tasks)))
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

const splitByOpType = (operations: OperationModel[]) => {
  return operations.reduce(
    (acc: Record<OperationModel['type'], OperationModel[]>, operation) => {
      acc[operation.type].push(operation)
      return acc
    },
    {
      create: [],
      update: [],
      delete: [],
    },
  )
}

const operationsEnhanced = operationsApi.enhanceEndpoints({
  endpoints: {
    operations: {},
  },
})

// enhance the argument type to include some extra fields
interface UpdateOverviewEntitiesArg extends OperationsApiArg {
  inheritedDependents?: InheritedDependent[]
}

const operationsApiEnhancedInjected = operationsEnhanced.injectEndpoints({
  endpoints: (build) => ({
    updateOverviewEntities: build.mutation<
      OperationsResponseModel | undefined,
      UpdateOverviewEntitiesArg
    >({
      async queryFn(arg, { dispatch }) {
        try {
          const result = await dispatch(operationsEnhanced.endpoints.operations.initiate(arg))

          const data = result.data

          return { data }
        } catch (e: any) {
          console.error(e)
          const error = { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError
          return { error }
        }
      },
      async onQueryStarted(
        { operationsRequestModel, inheritedDependents = [] },
        { dispatch, queryFulfilled, getState },
      ) {
        if (!operationsRequestModel.operations?.length) return
        const { operations } = operationsRequestModel
        // we need to split the operations by entity type
        const operationsByType = operations.reduce(
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
          // split operations by operation type
          const { create, delete: deleteOps, update } = splitByOpType(operationsByType.task)
          // filter out updates that are in inheritedDependentsTasks
          const updatesToPatch = update.filter(
            (op) => !inheritedDependents.some((dep) => dep.entityId === op.entityId),
          )
          // update existing tasks
          patchOverviewTasks(updatesToPatch, { state, dispatch }, patches)
          // invalidate the caches for tasks being created and deleted
          invalidateOverviewTasks([...create, ...deleteOps], {
            dispatch,
          })
        }

        // patch the overview folders (any any other folders from foldersList)
        if (operationsByType.folder?.length) {
          // split operations by operation type
          const { create, delete: deleteOps, update } = splitByOpType(operationsByType.folder)
          // filter out updates that are in inheritedDependentsTasks
          const updatesToPatch = update.filter(
            (op) => !inheritedDependents.some((dep) => dep.entityId === op.entityId),
          )
          // update existing folders
          patchOverviewFolders(updatesToPatch, { state, dispatch }, patches)
          // invalidate the caches for folders being created and deleted
          if (
            create.length ||
            deleteOps.length ||
            inheritedDependents.some((op) => op.entityType === 'folder')
          ) {
            dispatch(hierarchyApi.util.invalidateTags([{ type: 'folder', id: 'LIST' }]))
          }
        }

        const inheritedDependentsTasks = inheritedDependents.filter(
          (op) => op.entityType === 'task',
        )
        const inheritedDependentsFolders = inheritedDependents.filter(
          (op) => op.entityType === 'folder',
        )

        if (inheritedDependentsTasks.length) {
          invalidateOverviewTasks(inheritedDependentsTasks, { dispatch })
        }

        if (inheritedDependentsFolders.length) {
          dispatch(hierarchyApi.util.invalidateTags([{ type: 'folder', id: 'LIST' }]))
        }

        // try to patch any details panels
        // first we patch the individual entities
        // then we patch the details panel cache
        const entityTags = operations.map((op) => ({
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
                patchDetailsPanelEntity(operations, draft)
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
                  patchDetailsPanelEntity(operations, entity)
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
    }),
  }),
})

export const { useUpdateOverviewEntitiesMutation } = operationsApiEnhancedInjected
