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
    }
  }
})

export const {
  useExportFieldsQuery,
  useUploadFileMutation,
  useImportDataMutation,
} = enhancedApi
