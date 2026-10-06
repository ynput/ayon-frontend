import { useCallback } from 'react'
import { toast } from 'react-toastify'
import type { ExportTableRequest } from '@shared/api/generated/dataImport'
import { getRequestErrorString } from '@shared/util'
import {
  downloadUrl,
  getExportFileName,
  TableExportScope,
  TableExportSettings,
} from './tableExportSettings'

// what to export: rows and columns, the file options come from the settings
export type TableExportContent = Omit<
  ExportTableRequest,
  'format' | 'delimiter' | 'header' | 'values'
>

// A plain fetch, not an RTK mutation: the file does not belong in the store, and addon
// modules with their own copy of the API (review cards) reject mutations they don't know.
const requestExport = async (projectName: string, request: ExportTableRequest) => {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(
    `/api/csv/table/export?project_name=${encodeURIComponent(projectName)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // @ts-ignore
        'X-Sender': window.senderId,
      },
      body: JSON.stringify(request),
    },
  )
  if (!response.ok) {
    // the standard request error shape, for getRequestErrorString
    throw { status: response.status, data: await response.json().catch(() => ({})) }
  }
  return URL.createObjectURL(await response.blob())
}

// The server builds the file, so it has every row and inherited attribute the user can
// read, also ones the table has not loaded yet. Resolves to false when the export failed.
export const useTableExport = () =>
  useCallback(
    async (
      projectName: string,
      scope: TableExportScope,
      settings: TableExportSettings,
      content: TableExportContent,
    ): Promise<boolean> => {
      const toastId = toast.loading('Exporting...', { autoClose: false })
      try {
        const url = await requestExport(projectName, {
          ...content,
          format: settings.format,
          delimiter: settings.delimiter,
          header: settings.header,
          values: settings.values,
        })
        downloadUrl(url, getExportFileName(projectName, scope, settings))
        toast.dismiss(toastId)
        return true
      } catch (error) {
        toast.update(toastId, {
          render: `Export failed: ${getRequestErrorString(error)}`,
          type: 'error',
          autoClose: 5000,
          isLoading: false,
        })
        return false
      }
    },
    [],
  )
