import { projectFoldersApi, ProjectFoldersResponseModel } from '@shared/api/generated'

const PROJECT_FOLDER_LIST_TAG = { type: 'projectFolder' as const, id: 'LIST' }

// QUERY TYPE RESULTS

type GetProjectFoldersResult = NonNullable<ProjectFoldersResponseModel['folders']>

// REDEFINE TYPES
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import { getEntityId } from '@shared/util'
type Definitions = DefinitionsFromApi<typeof projectFoldersApi>
type TagTypes = TagTypesFromApi<typeof projectFoldersApi>
// update the definitions to include the new types
type UpdatedDefinitions = Omit<Definitions, 'getProjectFolders'> & {
  getProjectFolders: OverrideResultType<Definitions['getProjectFolders'], GetProjectFoldersResult>
}

const transformErrorResponse = (error: any) => error.data?.detail || 'Unknown project folder error'

const enhancedProjectFoldersApi = projectFoldersApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getProjectFolders: {
      transformResponse: (response: ProjectFoldersResponseModel) => response.folders || [],
      transformErrorResponse,
      providesTags: (result) =>
        result
          ? [
              PROJECT_FOLDER_LIST_TAG,
              ...result.map((folder) => ({ type: 'projectFolder', id: folder.id })),
            ]
          : [PROJECT_FOLDER_LIST_TAG],
    },
    createProjectFolder: {
      async onQueryStarted({ projectFolderPostModel }, { dispatch, queryFulfilled }) {
        // Optimistically add the new folder to the cache
        const patchResult = dispatch(
          enhancedProjectFoldersApi.util.updateQueryData('getProjectFolders', undefined, (draft) => {
            // Create the optimistic folder with a temporary ID if none provided
            const newFolder = {
              ...projectFolderPostModel,
              id: projectFolderPostModel.id || getEntityId(),
            }
            draft.push(newFolder)
          }),
        )

        try {
          await queryFulfilled
        } catch {
          // Undo the optimistic update if the mutation fails
          patchResult.undo()
        }
      },
      transformErrorResponse,
      invalidatesTags: [PROJECT_FOLDER_LIST_TAG],
    },
    deleteProjectFolder: {
      async onQueryStarted({ folderId }, { dispatch, queryFulfilled }) {
        // Optimistically remove the folder from the cache
        const patchResult = dispatch(
          enhancedProjectFoldersApi.util.updateQueryData('getProjectFolders', undefined, (draft) => {
            const folderIndex = draft.findIndex((folder) => folder.id === folderId)
            if (folderIndex !== -1) {
              draft.splice(folderIndex, 1)
            }
          }),
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
        { type: 'projectFolder', id: arg.folderId },
        { type: 'project', id: arg.folderId },
      ],
    },
    updateProjectFolder: {
      async onQueryStarted(
        { folderId, projectFolderPatchModel },
        { dispatch, queryFulfilled },
      ) {
        // Optimistically update the folder in the cache
        const patchResult = dispatch(
          enhancedProjectFoldersApi.util.updateQueryData('getProjectFolders', undefined, (draft) => {
            const folderIndex = draft.findIndex((folder) => folder.id === folderId)
            if (folderIndex !== -1) {
              const folder = draft[folderIndex]
              // Update the folder with the patch data
              Object.assign(folder, {
                ...folder,
                ...projectFolderPatchModel,
                data: {
                  ...folder.data,
                  ...projectFolderPatchModel.data,
                },
              })
            }
          }),
        )

        try {
          await queryFulfilled
        } catch {
          // Undo the optimistic update if the mutation fails
          patchResult.undo()
        }
      },
      transformErrorResponse,
      invalidatesTags: (_r, _e, arg) => [{ type: 'projectFolder', id: arg.folderId }],
    },
    assignProjectsToFolder: {
      transformErrorResponse,
      invalidatesTags: [{ type: 'project', id: 'LIST' }],
    },
  },
})

export const {
  useGetProjectFoldersQuery,
  useCreateProjectFolderMutation,
  useDeleteProjectFolderMutation,
  useUpdateProjectFolderMutation,
  useSetProjectFoldersOrderMutation,
  useAssignProjectsToFolderMutation,
} = enhancedProjectFoldersApi
