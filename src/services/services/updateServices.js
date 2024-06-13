import { ayonApi } from '../ayon'

const updateServices = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    createService: build.mutation({
      query: ({ serviceName, data }) => ({
        url: `/api/services/${serviceName}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['service'],
      transformErrorResponse: (response) => response.data,
    }),
    updateService: build.mutation({
      query: ({ serviceName, data }) => ({
        url: `/api/services/${serviceName}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['service'],
      transformErrorResponse: (response) => response.data,
    }),
    deleteService: build.mutation({
      query: ({ serviceName }) => ({
        url: `/api/services/${serviceName}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['service'],
      transformErrorResponse: (response) => response.data,
    }),
  }),
})

export const { useCreateServiceMutation, useUpdateServiceMutation, useDeleteServiceMutation } =
  updateServices
