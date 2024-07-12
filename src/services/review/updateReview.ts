import { DeleteProjectActivityApiResponse, DeleteProjectActivityApiArg } from '@/api/rest'
import api from '@api'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const injectedEndpoints = api.injectEndpoints({
  endpoints: (build) => ({
    deleteReviewable: build.mutation<DeleteProjectActivityApiResponse, DeleteProjectActivityApiArg>(
      {
        queryFn: async (args, { dispatch }) => {
          try {
            // get list of installed addons
            const res = await dispatch(api.endpoints.deleteProjectActivity.initiate(args))

            if (res.error) {
              return { error: res.error as FetchBaseQueryError }
            }

            return { data: res.data }
          } catch (e: any) {
            const error = { status: 'FETCH_ERROR', error: e.message } as FetchBaseQueryError
            return { error }
          }
        },
        invalidatesTags: (_result, _error, args) => [{ type: 'review', id: args.activityId }],
      },
    ),
  }),
})

export const { useDeleteReviewableMutation } = injectedEndpoints
