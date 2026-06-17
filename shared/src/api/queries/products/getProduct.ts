import { productsApi } from '@shared/api/generated'

export const enhancedProductsApi = productsApi.enhanceEndpoints({
  endpoints: {
    getProductTypes: {
      providesTags: (_result, _error, _args) => [{ type: 'productType', id: 'LIST' }],
    },
  },
})

export const { useGetProductTypesQuery } = enhancedProductsApi
