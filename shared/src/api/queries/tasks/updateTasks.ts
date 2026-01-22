import { api, SubTaskNode } from '@shared/api'
import { PatchOperation, patchOverviewTasks } from '../overview/updateOverview'
import { patchDetailsPanel } from '../entities/patchDetailsPanel'

const tasksApi = api.injectEndpoints({
  endpoints: (build) => ({
    updateSubtasks: build.mutation<
      void,
      { projectName: string; taskId: string; subtasks: SubTaskNode[] }
    >({
      query: ({ projectName, taskId, subtasks }) => ({
        url: `/api/projects/${projectName}/tasks/${taskId}`,
        method: 'PATCH',
        body: { subtasks },
      }),
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
