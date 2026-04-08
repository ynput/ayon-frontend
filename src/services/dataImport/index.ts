import { dataImportApi } from "@shared/api";

const enhancedApi = dataImportApi.enhanceEndpoints({
  endpoints: {
    importData: {
      invalidatesTags: (_r, _e, { folderId, projectName, importType, preview }) => {
        // for preview we don't need to refetch anything in the background
        if (preview) return []

        switch (importType) {
          case "hierarchy":
            return [
              { type: "overviewTask", id: projectName },
              { type: 'project', id: projectName },
            ]
          case "user":
            return [{ type: "user", id: "LIST" }]
          case "entity_list_item":
            return [{ type: "entityList", id: folderId }]
          default:
            return []
        }
      }
    }
  }
})

export const {
  useExportFieldsQuery,
  useUploadFileMutation,
  useImportDataMutation,
} = enhancedApi
