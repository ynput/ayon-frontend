import getListsAttributes from './getListsAttributes'

const updateListAttributes = getListsAttributes.enhanceEndpoints({
  endpoints: {
    setEntityListAttributesDefinition: {
      invalidatesTags: (_r, _e, { listId }) => [{ type: 'entityListAttribute', id: listId }],
    },
  },
})

export const { useSetEntityListAttributesDefinitionMutation } = updateListAttributes
export { updateListAttributes as entityListAttributesQuery }
