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
      query: ({ projectName, machineIdent, data }) => ({
        url: `/api/projects/${projectName}/roots/${machineIdent}`,
        method: 'PUT',
        body: data,
      }),

      async onQueryStarted({ projectName, machineIdent, data }, { dispatch, queryFulfilled }) {
        const putResult = dispatch(
          ayonApi.util.updateQueryData(
            'getCustomRoots',
            { projectName, machineIdent, data },
            (draft) => {
              Object.assign(draft, { ...data, [machineIdent]: data })
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
