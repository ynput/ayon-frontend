import api from './getAccessGroups'

const setAccessGroups = api.injectEndpoints({
  endpoints: (build) => ({
    createAccessGroup: build.mutation({
      query: ({ name }) => ({
        url: `/api/accessGroups/${name}/_`,
        method: 'PUT',
        body: {},
      }),
      invalidatesTags: [{ type: 'accessGroup', id: 'LIST' }],
    }),
    updateAccessGroups: build.mutation({
      query: (queryArg) => ({ url: `/api/access`, method: 'POST', body: queryArg.payload }),
      async onQueryStarted({ payload, selectedProjects }, { dispatch, queryFulfilled }) {
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
    }),
  }),
  overrideExisting: true,
})

export const { useCreateAccessGroupMutation, useUpdateAccessGroupsMutation } = setAccessGroups

const updateAccessGroupsApi = api.enhanceEndpoints({
  endpoints: {
    saveAccessGroup: {
      invalidatesTags: () => [{ type: 'accessGroup', id: 'LIST' }],
    },
    deleteAccessGroup: {
      invalidatesTags: () => [{ type: 'accessGroup', id: 'LIST' }],
    },
  },
})

export const { useSaveAccessGroupMutation, useDeleteAccessGroupMutation } = updateAccessGroupsApi
export { updateAccessGroupsApi as accessQueries }
