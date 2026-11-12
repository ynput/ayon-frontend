import getListsAttributes from './getListsAttributes'

const updateListAttributes = getListsAttributes.enhanceEndpoints({
  endpoints: {
    setEntityListAttributesDefinition: {
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        const { entityListId, projectName, payload } = arg

        const patchResult = dispatch(
          getListsAttributes.util.updateQueryData(
            'getEntityListAttributesDefinition',
            { entityListId, projectName },
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
      invalidatesTags: (_r, _e, { entityListId }) => [
        { type: 'entityListAttribute', id: entityListId },
      ],
    },
  },
})

export const { useSetEntityListAttributesDefinitionMutation } = updateListAttributes
export { updateListAttributes as entityListAttributesQuery }
