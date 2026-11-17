import { dataImportApi } from "@shared/api";
import type {
  ColumnMapping,
  ExportFieldsApiResponse,
  ImportDataApiResponse,
} from "@shared/api/generated/dataImport";

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
            return [
              { type: "overviewTask", id: projectName },
              { type: 'project', id: projectName },
              { type: 'folder', id: 'LIST' },
              'hierarchy',
            ]
          case "user":
            return [{ type: "user", id: "LIST" }]
          case "entity_list_item":
            // an import without a list creates one
            return [{ type: "entityList", id: folderId ?? "LIST" }]
          default:
            return []
        }
      }
    }
  }
})

// An addon's import (openImport in @ynput/ayon-addon): the addon's endpoints, with the
// contract of the ones above
const addonImportApi = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    addonImportFields: build.query<
      ExportFieldsApiResponse,
      { url: string; projectName?: string }
    >({
      query: ({ url, projectName }) => ({ url, params: { project_name: projectName } }),
    }),
    addonImportData: build.mutation<
      ImportDataApiResponse,
      {
        url: string
        fileId: string
        columnMapping: ColumnMapping[]
        preview?: boolean
        projectName?: string
      }
    >({
      query: ({ url, fileId, columnMapping, preview, projectName }) => ({
        url,
        method: "POST",
        body: columnMapping,
        params: { file_id: fileId, preview, project_name: projectName },
      }),
    }),
  }),
})

export const {
  useExportFieldsQuery,
  useUploadFileMutation,
  useImportDataMutation,
} = enhancedApi

export const { useAddonImportFieldsQuery, useAddonImportDataMutation } = addonImportApi
