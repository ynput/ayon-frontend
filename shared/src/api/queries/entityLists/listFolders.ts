import { entityListsApi, EntityListFoldersResponseModel } from '@shared/api/generated'

const LIST_FOLDER_LIST_TAG = { type: 'entityListFolder' as const, id: 'LIST' }

// QUERY TYPE RESULTS

type GetEntityListFoldersResult = NonNullable<EntityListFoldersResponseModel['folders']>

// REDEFINE TYPES
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import { getEntityId } from '@shared/util'
type Definitions = DefinitionsFromApi<typeof entityListsApi>
type TagTypes = TagTypesFromApi<typeof entityListsApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getEntityListFolders'> & {
  getEntityListFolders: OverrideResultType<
    Definitions['getEntityListFolders'],
    GetEntityListFoldersResult
  >
}

const transformErrorResponse = (error: any) => error.data?.detail || 'Unknown lists folder error'

const enhancedListsFoldersApi = entityListsApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getEntityListFolders: {
      transformResponse: (response: EntityListFoldersResponseModel) => response.folders || [],
      transformErrorResponse,
      providesTags: (result) =>
        result
          ? [
              LIST_FOLDER_LIST_TAG,
              ...result.map((folder) => ({ type: 'entityListFolder', id: folder.id })),
            ]
          : [LIST_FOLDER_LIST_TAG],
    },
    createEntityListFolder: {
      async onQueryStarted(
        { projectName, entityListFolderPostModel },
        { dispatch, queryFulfilled },
      ) {
        // Optimistically add the new folder to the cache
        const patchResult = dispatch(
          enhancedListsFoldersApi.util.updateQueryData(
            'getEntityListFolders',
            { projectName },
            (draft) => {
              // Create the optimistic folder with a temporary ID if none provided
              const newFolder = {
                ...entityListFolderPostModel,
                id: entityListFolderPostModel.id || getEntityId(),
              }
              draft.push(newFolder)
            },
          ),
        )

        try {
          await queryFulfilled
        } catch {
          // Undo the optimistic update if the mutation fails
          patchResult.undo()
        }
      },
      transformErrorResponse,
      invalidatesTags: [LIST_FOLDER_LIST_TAG],
    },
    deleteEntityListFolder: {
      async onQueryStarted({ projectName, folderId }, { dispatch, queryFulfilled }) {
        // Optimistically remove the folder from the cache
        const patchResult = dispatch(
          enhancedListsFoldersApi.util.updateQueryData(
            'getEntityListFolders',
            { projectName },
            (draft) => {
              const folderIndex = draft.findIndex((folder) => folder.id === folderId)
              if (folderIndex !== -1) {
                draft.splice(folderIndex, 1)
              }
            },
          ),
        )

        try {
          await queryFulfilled
        } catch {
          // Undo the optimistic update if the mutation fails
          patchResult.undo()
        }
      },
      transformErrorResponse,
      invalidatesTags: (_r, _e, arg) => [
        { type: 'entityListFolder', id: arg.folderId },
        { type: 'entityList', id: arg.folderId },
      ],
    },
    updateEntityListFolder: {
      async onQueryStarted(
        { projectName, folderId, entityListFolderPatchModel },
        { dispatch, queryFulfilled },
      ) {
        // Optimistically update the folder in the cache
        const patchResult = dispatch(
          enhancedListsFoldersApi.util.updateQueryData(
            'getEntityListFolders',
            { projectName },
            (draft) => {
              const folderIndex = draft.findIndex((folder) => folder.id === folderId)
              if (folderIndex !== -1) {
                const folder = draft[folderIndex]
                // Update the folder with the patch data
                Object.assign(folder, {
                  ...folder,
                  ...entityListFolderPatchModel,
                  data: {
                    ...folder.data,
                    ...entityListFolderPatchModel.data,
                  },
                })
              }
            },
          ),
        )

        try {
          await queryFulfilled
        } catch {
          // Undo the optimistic update if the mutation fails
          patchResult.undo()
        }
      },
      transformErrorResponse,
      invalidatesTags: (_r, _e, arg) => [{ type: 'entityListFolder', id: arg.folderId }],
    },
  },
})

export const {
  useGetEntityListFoldersQuery,
  useCreateEntityListFolderMutation,
  useDeleteEntityListFolderMutation,
  useUpdateEntityListFolderMutation,
} = enhancedListsFoldersApi
