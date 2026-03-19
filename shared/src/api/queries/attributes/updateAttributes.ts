import attributesApi from './getAttributes'

const updateAttributes = attributesApi.enhanceEndpoints({
  endpoints: {
    setAttributeList: {
      invalidatesTags: ['attribute'],
    },
    setAttributeConfig: {
      invalidatesTags: (_r, _e, { attributeName }) => [{ type: 'attribute', id: attributeName }],
    },
    patchAttributeConfig: {
      invalidatesTags: (_r, _e, { attributeName }) => [{ type: 'attribute', id: attributeName }],
    },
  },
})

export const { useSetAttributeListMutation, usePatchAttributeConfigMutation } = updateAttributes
export { updateAttributes as attributesQueries }
