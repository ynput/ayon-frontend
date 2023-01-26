import { ayonApi } from './ayon'

const customRoots = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getCustomRoots: build.query({
      query: ({ projectName }) => ({
        url: `/api/projects/${projectName}/roots`,
        method: 'GET',
      }),

      providesTags: ['customRoots'],
      transformResponse: (response) => response,
      transformErrorResponse: (error) => error.data.detail || `Error ${error.status}`,
    }),

    setCustomRoots: build.mutation({
      query: ({ projectName, siteId, data }) => ({
        url: `/api/projects/${projectName}/roots/${siteId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['customRoots'],

      async onQueryStarted({ projectName, siteId, data }, { dispatch, queryFulfilled }) {
        const putResult = dispatch(
          ayonApi.util.updateQueryData('getCustomRoots', { projectName, siteId, data }, (draft) => {
            Object.assign(draft, { ...data, [siteId]: data })
          }),
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
