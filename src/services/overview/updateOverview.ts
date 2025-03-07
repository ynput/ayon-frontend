import { OperationModel, api as operationsApi } from '@api/rest/operations'
import tasksApi from '@queries/overview/getOverview'
import hierarchyApi from '@queries/getHierarchy'
import { getEntityPanelApi } from '@queries/entity/getEntityPanel'
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

const operationsEnhanced = operationsApi.enhanceEndpoints({
  endpoints: {
    operations: {
      async onQueryStarted(
        { operationsRequestModel, projectName },
        { dispatch, queryFulfilled, getState },
      ) {
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

        if (operationsByType.task?.length) {
          const tags = [
            { type: 'overviewTask', id: 'LIST' },
            ...operationsByType.task.map((op) => ({ type: 'overviewTask', id: op.entityId })),
          ]
          const entries = tasksApi.util.selectInvalidatedBy(state, tags)
          // console.log({ entries })

          for (const entry of entries) {
            // this updates the main overview cache task
            // it also updates any GetTasksByParent caches
            const tasksPatch = dispatch(
              tasksApi.util.updateQueryData(
                entry.endpointName as
                  | 'getOverviewTasksByFolders'
                  | 'GetTasksByParent'
                  | 'GetTasksList',
                entry.originalArgs,
                (draft) => {
                  console.time('updateQueryData')
                  // Apply each change to matching tasks in the cache
                  for (const taskOperation of operationsByType.task) {
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
                      if (task) {
                        updateEntityWithOperation(task, taskOperation.data)
                      }
                    }
                  }
                  console.timeEnd('updateQueryData')
                },
              ),
            )
            // add the patch to the list of patches
            patches.push(tasksPatch)
          }
        }

        if (operationsByType.folder?.length) {
          const folderPatch = dispatch(
            hierarchyApi.util.updateQueryData(
              'getFolderList',
              { projectName, attrib: true },
              (draft) => {
                // Apply each change to matching folders in the cache
                for (const folderOperation of operationsByType.folder) {
                  const folder = draft.folders.find((el) => el.id === folderOperation.entityId)
                  if (folder) {
                    updateEntityWithOperation(folder, folderOperation.data)
                  }
                }
              },
            ),
          )
          //   add the patch to the list of patches
          patches.push(folderPatch)
        }

        // try to patch any details panels
        // first we patch the individual entities
        // then we invalidate the details panel cache that will use these patched entities
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

        const entries = tasksApi.util.selectInvalidatedBy(state, entityTags)

        for (const entry of entries) {
          // only patch the getEntityDetailsPanel cache
          if (entry.endpointName !== 'getEntityDetailsPanel') continue
          let entityDetailsResult = dispatch(
            getEntityPanelApi.util.updateQueryData(
              'getEntityDetailsPanel',
              entry.originalArgs,
              (draft) => {
                // find the entity we are updating from the draft
                const data = operationsRequestModel.operations?.find(
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
              },
            ),
          )
          // add the patch to the list of patches
          patches.push(entityDetailsResult)

          // invalidate the details panel cache
          invalidateEntryPanel()
        }

        try {
          await queryFulfilled
        } catch (error) {
          // undo all patches if there is an error
          for (const patch of patches) {
            patch.undo()
          }

          if (entries.length) {
            // we invalidate the tags for the entries that were patched
            // invalidate the details panel cache
            invalidateEntryPanel()
          }
        }
      },
    },
  },
})

export const { useOperationsMutation } = operationsEnhanced
