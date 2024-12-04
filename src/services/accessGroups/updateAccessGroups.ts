import { $Any } from '@types'
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
      async onQueryStarted({ payload }, { dispatch, queryFulfilled }) {
        let projects = []
        for (const user of Object.keys(payload)) {
          projects.push(...Object.keys(payload[user]))
        }

        const patchResult = dispatch(
          api.util.updateQueryData(
            // @ts-ignore
            'getProjectsAccess',
            { projects: [...new Set(projects)] },
            (draft: $Any) => {
              for (const user of Object.keys(payload)) {
                for (const project of Object.keys(payload[user])) {
                  draft = {
                    ...draft,
                    [project]: {
                      ...draft[project],
                      [user]: payload[user][project],
                    },
                  }
                }
              }
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
