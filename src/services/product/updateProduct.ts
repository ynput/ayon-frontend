import { productsApi } from '@shared/api'

const enhancedApi = productsApi.enhanceEndpoints({
  endpoints: {
    deleteProduct: {
      invalidatesTags: (_r, _e, { productId }) => [{ type: 'product', id: productId }],
    },
  },
})

export const { useDeleteProductMutation } = enhancedApi
