import { ayonApi } from './ayon'

const customRoots = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getCustomRoots: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/roots`,
        method: 'GET',
      }),

      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    setCustomRoots: build.mutation({
      query: ({ projectName, machineId, data }) => ({
        url: `/api/projects/${projectName}/roots/${machineId}`,
        method: 'PUT',
        body: data,
      }),

      async onQueryStarted({ projectName, machineId, data }, { dispatch, queryFulfilled }) {
        const putResult = dispatch(
          ayonApi.util.updateQueryData(
            'getCustomRoots',
            { projectName, machineId, data },
            (draft) => {
              Object.assign(draft, { ...data, [machineId]: data })
            },
          ),
        )
        try {
          await queryFulfilled
        } catch {
          putResult.undo()
        }
      }, // onQueryStarted
    }), // setCustomRoots
  }),
})

export const { useGetCustomRootsQuery, useSetCustomRootsMutation } = customRoots
