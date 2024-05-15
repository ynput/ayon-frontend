import { ayonApi } from '../ayon'
import { toast } from 'react-toastify'

const updateEntity = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    updateEntity: build.mutation({
      query: ({ projectName, entityId, data, entityType }) => ({
        url: `/api/projects/${projectName}/${entityType}s/${entityId}`,
        method: 'PATCH',
        body: data,
      }),
      async onQueryStarted(
        { projectName, entityId, data, assignees, entityType },
        { dispatch, queryFulfilled },
      ) {
        let patchResult

        // if task, patch the getProjectTasks query
        if (entityType === 'task') {
          patchResult = dispatch(
            ayonApi.util.updateQueryData('getProjectTasks', { projectName, assignees }, (draft) => {
              const taskIndex = draft.findIndex((task) => task.id === entityId)
              if (taskIndex === -1) {
                // check if the task has any of the assignees that are selected in kanBan
                if (assignees.some((assignee) => data.assignees?.includes(assignee))) {
                  // task should appear in kanBan
                  // invalidate the kanBan and getProjectTasks query to force refetch
                  dispatch(
                    ayonApi.util.invalidateTags([
                      { type: 'kanBanTask', id: 'TASKS' },
                      { type: 'kanBanTask', id: 'TASKS' },
                    ]),
                  )
                } else {
                  // do nothing, the task should not appear in the kanBan
                  return
                }
                // add the task to the cache
              } else {
                // task found: update the task in the cache
                const newData = { ...draft[taskIndex], ...data }
                draft[taskIndex] = newData
              }
            }),
          )
        }

        // patch any entity details panels in dashboard
        let entityDetailsResult = dispatch(
          ayonApi.util.updateQueryData(
            'getDashboardEntityDetails',
            { entityId, entityType, projectName },
            (draft) => {
              // convert assignees to users
              const patchData = { ...data }
              if (patchData.assignees) {
                patchData.users = patchData.assignees
                delete patchData.assignees
              }
              const newData = { ...draft, ...patchData }
              Object.assign(draft, newData)
            },
          ),
        )

        try {
          await queryFulfilled
        } catch (error) {
          console.error('error updating ' + entityType, error)
          toast.error(error?.error?.data?.detail || 'Failed to update task')
          patchResult?.undo()
          entityDetailsResult?.undo()
        }
      },
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
                entityId: id,
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

          // invalidate any entities queries (multi entity selection) to force refetch
          // but because we just updated the getEntityDetails cache it should be instant
          dispatch(
            ayonApi.util.invalidateTags(operations.map((o) => ({ type: 'entities', id: o.id }))),
          )

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
          // const fieldsWithNewActivity = ['status', 'assignees']

          // invalidate the activity query of the entity activities

          // operations.forEach((operation) => {
          //   // check if any of the fields in the operation data are in the fieldsWithNewActivity array
          //   const hasAtLeastOneField = fieldsWithNewActivity.some(
          //     (field) => field in (operation.data || {}),
          //   )
          //   if (hasAtLeastOneField) {
          //     const getActivitiesTags = [{ type: 'entityActivities', id: operation.id }]
          //     activityTags.push(...getActivitiesTags)
          //   }
          // })

          if (activityTags.length) {
            dispatch(ayonApi.util.invalidateTags(activityTags))
          }

          return { data: operations }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      // invalidatesTags: (result, error, { operations, entityType }) =>
      //   operations.map((o) => ({ id: o.id, type: 'entities' })),
    }),
  }),
})

export const { useUpdateEntitiesMutation } = updateEntity
