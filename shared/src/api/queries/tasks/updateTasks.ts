import { SubTaskNode } from '@shared/api'
import { api } from '@shared/api/generated/tasks'
import { PatchOperation, patchOverviewTasks } from '../overview/updateOverview'
import { patchDetailsPanel } from '../entities/patchDetailsPanel'
import gqlApi from '../entityLists/getLists'

/**
 * Patches list items caches that contain the specified task with updated subtasks
 */
export const patchListItemsWithTask = (
  taskId: string,
  subtasks: SubTaskNode[],
  { state, dispatch }: { state: any; dispatch: any },
  patches: any[],
) => {
  // Find all list item caches that might contain this task
  const tags = [{ type: 'entityListItem', id: taskId }]
  const infiniteEntries = gqlApi.util
    .selectInvalidatedBy(state, tags)
    .filter((e) => e.endpointName === 'getListItemsInfinite')

  for (const entry of infiniteEntries) {
    const patchResult = dispatch(
      gqlApi.util.updateQueryData('getListItemsInfinite', entry.originalArgs, (draft) => {
        for (const page of draft.pages) {
          const itemIndex = page.items.findIndex((item) => item.entityId === taskId)
          if (itemIndex !== -1) {
            const item = page.items[itemIndex]
            // Update subtasks in the item's attributes
            if (!item.subtasks) {
              item.subtasks = []
            }
            // @ts-expect-error - we need to update the subtasks array in place to ensure React detects the change
            item.subtasks = subtasks
          }
        }
      }),
    )
    patches.push(patchResult)
  }
}

const tasksApi = api.injectEndpoints({
  endpoints: (build) => ({
    updateSubtasks: build.mutation<
      void,
      { projectName: string; taskId: string; subtasks: SubTaskNode[] }
    >({
      queryFn: async ({ projectName, taskId, subtasks }, { dispatch }) => {
        try {
          await dispatch(
            api.endpoints.updateTask.initiate({
              projectName,
              taskId,
              taskPatchModel: {
                data: { subtasks },
              },
            }),
          ).unwrap()

          return { data: undefined }
        } catch (error: any) {
          return { error: error.data?.detail || 'Failed to update subtasks (unknown error)' }
        }
      },
      async onQueryStarted({ taskId, subtasks }, { dispatch, queryFulfilled, getState }) {
        const state = getState()
        const patches: any[] = []

        const patchOperations: PatchOperation[] = [
          {
            entityId: taskId,
            entityType: 'task',
            data: { subtasks },
          },
        ]

        // 1. Patch Overview Tasks
        patchOverviewTasks(patchOperations, { state, dispatch }, patches)

        // 2. patch details panel
        patchDetailsPanel(patchOperations, { state, dispatch }, patches)

        // 3. patch lists items with the task in it
        patchListItemsWithTask(taskId, subtasks, { state, dispatch }, patches)

        try {
          await queryFulfilled
        } catch (error) {
          console.error('Error updating subtasks:', error)
          patches.forEach((patch) => patch.undo())
        }
      },
    }),
  }),
})

export const { useUpdateSubtasksMutation } = tasksApi
