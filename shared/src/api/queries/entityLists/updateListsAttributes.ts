import getListsAttributes from './getListsAttributes'

const updateListAttributes = getListsAttributes.enhanceEndpoints({
  endpoints: {
    setEntityListAttributesDefinition: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const { listId, projectName, payload } = arg

        const patchResult = dispatch(
          getListsAttributes.util.updateQueryData(
            'getEntityListAttributesDefinition',
            { listId, projectName },
            (draft) => payload,
          ),
        )
        try {
          await queryFulfilled
        } catch (error) {
          // Rollback the optimistic update if the query fails
          patchResult.undo()
        }
      },
      invalidatesTags: (_r, _e, { listId }) => [{ type: 'entityListAttribute', id: listId }],
    },
  },
})

export const { useSetEntityListAttributesDefinitionMutation } = updateListAttributes
export { updateListAttributes as entityListAttributesQuery }
