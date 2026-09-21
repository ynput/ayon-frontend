import api from '@shared/api'

const ynputConnect = api.injectEndpoints({
  endpoints: (build) => ({
    getYnputConnections: build.query({
      query: () => ({
        url: `/api/connect`,
        method: 'GET',
      }),
      providesTags: ['connections'],
      transformResponse: (response) => response,
    }),
    connectYnput: build.mutation({
      query: ({ key }) => ({
        url: `/api/connect`,
        method: 'POST',
        body: { key },
      }),
      transformResponse: (response) => response,
      invalidatesTags: ['connections'],
    }),
    discountYnput: build.mutation({
      query: () => ({
        url: `/api/connect`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response,
      invalidatesTags: ['connections'],
    }),
  }),
  overrideExisting: true,
})

export const { useConnectYnputMutation, useDiscountYnputMutation, useGetYnputConnectionsQuery } =
  ynputConnect
