import { ayonApi } from '../ayon'

const updateUserDashboard = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateTask: build.mutation({
      query: ({ projectName, taskId, data }) => ({
        url: `/api/projects/${projectName}/tasks/${taskId}`,
        method: 'PATCH',
        body: data,
      }),
      async onQueryStarted({ projectName, taskId, data, assignees }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          ayonApi.util.updateQueryData('getProjectTasks', { projectName, assignees }, (draft) => {
            const taskIndex = draft.findIndex((task) => task.id === taskId)
            if (taskIndex === -1) return
            const newData = { ...draft[taskIndex], ...data }
            draft[taskIndex] = newData
          }),
        )
        // invalidate task to force refetch of getKanBan query
        // but because we just updated the tasks cache it should be instant
        dispatch(ayonApi.util.invalidateTags([{ type: 'kanBanTask', id: taskId }]))
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (result, error, { taskId }) => [{ type: 'task', id: taskId }],
    }),
  }),
})

export const { useUpdateTaskMutation } = updateUserDashboard
