import { OperationModel, api as operationsApi } from '@api/rest/operations'
import tasksApi from '@queries/overview/getOverview'
import hierarchyApi from '@queries/getHierarchy'
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
        const patches: any[] = []

        if (operationsByType.task?.length) {
          const state = getState()
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
                entry.endpointName as 'getOverviewTasksByFolders' | 'GetTasksByParent',
                entry.originalArgs,
                (draft) => {
                  // Apply each change to matching tasks in the cache
                  for (const taskOperation of operationsByType.task) {
                    const task = draft.find((task) => task.id === taskOperation.entityId)
                    if (task) {
                      updateEntityWithOperation(task, taskOperation.data)
                    }
                  }
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

        try {
          await queryFulfilled
        } catch (error) {
          // undo all patches if there is an error
          for (const patch of patches) {
            patch.undo()
          }
        }
      },
    },
  },
})

export const { useOperationsMutation } = operationsEnhanced
