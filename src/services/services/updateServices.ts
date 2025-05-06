import getServicesApi from './getServices'

const enhancedServicesApi = getServicesApi.enhanceEndpoints({
  endpoints: {
    spawnService: {
      invalidatesTags: ['service'],
    },
    patchService: {
      invalidatesTags: ['service'],
    },
    deleteService: {
      invalidatesTags: ['service'],
    },
  },
})

export const { useSpawnServiceMutation, usePatchServiceMutation, useDeleteServiceMutation } =
  enhancedServicesApi
export { enhancedServicesApi as servicesQueries }
