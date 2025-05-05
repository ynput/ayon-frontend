import attributesApi from './getAttributes'

const updateAttributes = attributesApi.enhanceEndpoints({
  endpoints: {
    setAttributeList: {
      invalidatesTags: ['attribute'],
    },
  },
})

export const { useSetAttributeListMutation } = updateAttributes
export { updateAttributes as attributesQueries }
