import { SubTaskNode } from '@shared/api'
import { api } from '@shared/api/generated/tasks'
import { PatchOperation, patchOverviewTasks } from '../overview/updateOverview'
import { patchDetailsPanel } from '../entities/patchDetailsPanel'

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
          return { error }
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
