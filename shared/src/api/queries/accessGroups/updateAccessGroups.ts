import api from './getAccessGroups'

const updateAccessGroupsApi = api.enhanceEndpoints({
  endpoints: {
    setProjectsAccess: {
      async onQueryStarted({ payload }, { dispatch, queryFulfilled }) {
        const selectedProjects = [
          ...new Set(Object.values(payload).flatMap((projects) => Object.keys(projects))),
        ]
        const patchResult = dispatch(
          api.util.updateQueryData(
            // @ts-ignore
            'getProjectsAccess',
            { projects: selectedProjects },
            (draft: any) => {
              let updatedData: any = {}
              for (const user of Object.keys(payload)) {
                for (const project of Object.keys(payload[user])) {
                  updatedData = {
                    ...updatedData,
                    [project]: {
                      ...(draft[project] || {}),
                      ...(updatedData[project] || {}),
                      [user]: payload[user][project],
                    },
                  }
                }
              }

              return { ...draft, ...updatedData }
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      // @ts-ignore
      invalidatesTags: (_result, _error, { payload }) => {
        let projects = []
        for (const user of Object.keys(payload)) {
          projects.push(...Object.keys(payload[user]))
        }

        let invalidations = []
        for (const project of [...new Set(projects)]) {
          invalidations.push({ type: 'projectAccess', id: project })
        }

        return invalidations
      },
    },
    saveAccessGroup: {
      invalidatesTags: () => [{ type: 'accessGroup', id: 'LIST' }],
    },
    deleteAccessGroup: {
      invalidatesTags: () => [{ type: 'accessGroup', id: 'LIST' }],
    },
  },
})

export const {
  useSetProjectsAccessMutation,
  useSaveAccessGroupMutation,
  useDeleteAccessGroupMutation,
} = updateAccessGroupsApi
export { updateAccessGroupsApi as accessQueries }
