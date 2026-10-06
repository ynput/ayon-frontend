import { dataImportApi } from '@shared/api/generated'

const exportHierarchyApi = dataImportApi.enhanceEndpoints({
  endpoints: {
    exportHierarchyView: {
      query: ({ projectName, exportViewRequest }) => ({
        url: '/api/csv/export/hierarchy/view',
        method: 'POST',
        body: exportViewRequest,
        params: { project_name: projectName },
        // the file comes back as text, errors stay JSON
        responseHandler: 'content-type',
      }),
    },
  },
})

export const { useExportHierarchyViewMutation, useLazyExportFieldsQuery } = exportHierarchyApi
