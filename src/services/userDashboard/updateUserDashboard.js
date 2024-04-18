import { ayonApi } from '../ayon'
import { toast } from 'react-toastify'

const updateUserDashboard = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateEntity: build.mutation({
      query: ({ projectName, taskId, data, entityType }) => ({
        url: `/api/projects/${projectName}/${entityType}s/${taskId}`,
        method: 'PATCH',
        body: data,
      }),
      async onQueryStarted(
        { projectName, taskId, data, assignees, entityType },
        { dispatch, queryFulfilled },
      ) {
        let patchResult

        // if task,
        if (entityType === 'task') {
          patchResult = dispatch(
            ayonApi.util.updateQueryData('getProjectTasks', { projectName, assignees }, (draft) => {
              const taskIndex = draft.findIndex((task) => task.id === taskId)
              if (taskIndex === -1) return
              const newData = { ...draft[taskIndex], ...data }
              draft[taskIndex] = newData
            }),
          )
        }

        try {
          await queryFulfilled
        } catch (error) {
          console.error('error updating ' + entityType, error)
          toast.error(error?.error?.data?.detail || 'Failed to update task')
          patchResult?.undo()
        }
      },
      // this triggers a refetch of anything with the entity id tag
      invalidatesTags: (result, error, { taskId, entityType }) => [
        { type: entityType, id: taskId },
      ],
    }),
    updateEntities: build.mutation({
      async queryFn({ operations = [], entityType }, { dispatch, getState }) {
        let assignees = [...getState().dashboard.tasks.assignees]
        const assigneesIsMe = getState().dashboard.tasks.assigneesIsMe

        if (assigneesIsMe) {
          // get current user
          assignees = [getState().user.name]
        }

        try {
          const promises = []
          for (const { projectName, data, id } of operations) {
            const promise = dispatch(
              ayonApi.endpoints.updateEntity.initiate({
                projectName: projectName,
                taskId: id,
                data,
                assignees,
                entityType,
              }),
            )
            promises.push(promise)
          }

          // invalidate task to force refetch of getKanBan query
          // but because we just updated the tasks cache it should be instant
          if (entityType === 'task') {
            dispatch(
              ayonApi.util.invalidateTags(
                operations.map((o) => ({ type: 'kanBanTask', id: o.id })),
              ),
            )
          }

          // check if any of the requests failed and invalidate the tasks cache again to refetch
          const results = await Promise.allSettled(promises)
          if (results.some((result) => result.value?.error)) {
            dispatch(
              ayonApi.util.invalidateTags(
                operations.map((o) => ({ type: 'kanBanTask', id: o.id })),
              ),
            )
          }

          const activityTags = []

          // these are the fields that if changed will trigger a new activity
          const fieldsWithNewActivity = ['status', 'assignees']

          // invalidate the activity query of the entity activities
          operations.forEach((operation) => {
            // check if any of the fields in the operation data are in the fieldsWithNewActivity array
            const hasAtLeastOneField = fieldsWithNewActivity.some(
              (field) => field in (operation.data || {}),
            )
            if (hasAtLeastOneField) {
              const getActivitiesTags = [{ type: 'entityActivities', id: operation.id }]
              activityTags.push(...getActivitiesTags)
            }
          })

          if (activityTags.length) {
            dispatch(ayonApi.util.invalidateTags(activityTags))
          }

          return { data: operations }
        } catch (error) {
          console.error(error)
          return error
        }
      },
    }),
  }),
})

export const { useUpdateEntitiesMutation } = updateUserDashboard
