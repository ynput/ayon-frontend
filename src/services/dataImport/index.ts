import { dataImportApi } from "@shared/api";

const enhancedApi = dataImportApi.enhanceEndpoints({
  endpoints: {
    uploadFile: {
      query: ({ csv, ttl }) => ({
        url: `/api/csv/import/upload`,
        method: 'PUT',
        body: csv,
        headers: {
          'Content-Type': 'text/csv',
        },
        params: {
          ttl,
        },
      }),
    },
    importData: {
      invalidatesTags: (_r, _e, { folderId, projectName, importType, preview }) => {
        // for preview we don't need to refetch anything in the background
        if (preview) return []

        switch (importType) {
          case "hierarchy":
            // the folder list (overview table and hierarchy sidebar) is not updated over the
            // websocket, because the import's events carry our own sender id
            return [
              { type: "overviewTask", id: projectName },
              { type: 'project', id: projectName },
              { type: 'folder', id: 'LIST' },
              'hierarchy',
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
