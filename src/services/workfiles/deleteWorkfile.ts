// we continue to use the api from getWorkfiles.js
import api from '../getWorkfiles'

const deleteWorkfile = api.injectEndpoints({
  endpoints: (build) => ({
    deleteWorkfile: build.mutation({
      query: ({ projectName, workfileId }) => ({
        url: `/api/projects/${projectName}/workfiles/${workfileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'workfile', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
})

export const { useDeleteWorkfileMutation } = deleteWorkfile
export { deleteWorkfile as workfilesQueries }
