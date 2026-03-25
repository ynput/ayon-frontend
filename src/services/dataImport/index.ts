import { dataImportApi } from "@shared/api";

const enhancedApi = dataImportApi.enhanceEndpoints({
  endpoints: {
    uploadFile: {
      query: ({ csv }) => ({
        url: `/api/csv/import/upload`,
        method: 'PUT',
        body: csv,
        headers: {
          'Content-Type': 'text/csv',
        }
      }),
    }
  }
})

export const {
  useExportFieldsQuery,
  useUploadFileMutation,
  useImportDataMutation,
} = enhancedApi
