import { enhancedProductsApi as productsApi } from './getProduct'

const enhancedProductsApi = productsApi.enhanceEndpoints({
  endpoints: {
    createProduct: {
      invalidatesTags: (_r, _e, { productPostModel }) => [
        { type: 'product', id: productPostModel.folderId },
      ],
      transformErrorResponse: (error: any) => ({ message: error.data?.detail }),
    },
  },
})

export const { useCreateProductMutation } = enhancedProductsApi
