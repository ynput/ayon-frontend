import { useCallback } from 'react'
import { toast } from 'react-toastify'
import type { ExportTableRequest } from '@shared/api/generated/tableExport'
import { getRequestErrorString } from '@shared/util'
import {
  downloadUrl,
  getExportFileName,
  TableExportScope,
  TableExportSettings,
} from './tableExportSettings'

// what to export: rows and columns, the project and file options are added by the hook
export type TableExportContent = Omit<
  ExportTableRequest,
  'projectName' | 'format' | 'delimiter' | 'header' | 'values'
>

// A plain fetch, not an RTK mutation: the file does not belong in the store, and addon
// modules with their own copy of the API (review cards) reject mutations they don't know.
const requestExport = async (request: ExportTableRequest) => {
  const token = localStorage.getItem('accessToken')
  const response = await fetch('/api/export-table', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // @ts-ignore
      'X-Sender': window.senderId,
    },
    body: JSON.stringify(request),
  })
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
        const url = await requestExport({
          ...content,
          projectName,
          format: settings.format,
          delimiter: settings.delimiter,
          header: settings.content === 'raw' ? 'key' : 'label',
          values: settings.content === 'raw' ? 'value' : 'label',
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
