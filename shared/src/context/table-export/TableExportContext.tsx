import { ReactNode, useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { usePowerpack } from '../powerpack/PowerpackContextInstance'
import { useRemoteModules } from '../remote-modules/RemoteModulesContextInstance'
import {
  TABLE_EXPORT_SEARCH_PARAM,
  TableExportContext,
  TableExportScope,
  TableExportSource,
} from './TableExportContextInstance'

const ADDON = 'powerpack'
const REMOTE = 'tableExport'
const MODULE = 'TableExportApp'
const PP_VERSION = '1.6.9'

// At the app root, inside the router. Pages register what their table exports, the
// toolbar and the context menu open the export, the Power Pack module renders the dialog.
export const TableExportProvider = ({ children }: { children: ReactNode }) => {
  const [source, setSource] = useState<TableExportSource | null>(null)
  const [, setSearchParams] = useSearchParams()
  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const { modules } = useRemoteModules()

  const isInstalled = modules.some(
    (addon) => addon.addonName === ADDON && addon.modules[REMOTE]?.includes(MODULE),
  )
  const isAvailable = !!powerLicense && isInstalled

  const registerSource = useCallback((next: TableExportSource) => {
    setSource(next)
    return () => setSource((current) => (current === next ? null : current))
  }, [])

  const openExport = useCallback(
    (scope: TableExportScope) => {
      if (!powerLicense) return setPowerpackDialog('tableExport')
      if (!isInstalled)
        return void toast.error('Update to Power Pack ' + PP_VERSION + ' to export tables')
      setSearchParams((params) => {
        params.set(TABLE_EXPORT_SEARCH_PARAM, scope)
        return params
      })
    },
    [powerLicense, isInstalled, setPowerpackDialog, setSearchParams],
  )

  const value = useMemo(
    () => ({ source, isAvailable, openExport, registerSource }),
    [source, isAvailable, openExport, registerSource],
  )

  return <TableExportContext.Provider value={value}>{children}</TableExportContext.Provider>
}
