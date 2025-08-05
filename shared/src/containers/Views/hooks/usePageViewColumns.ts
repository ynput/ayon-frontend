// this hook converts the columns settings from a view into the format used by tanstack/react-table

import { useViewsContext } from '../context/ViewsContext'
import { ColumnsConfig } from '@shared/containers/ProjectTreeTable'
import {
  convertColumnConfigToTanstackStates,
  convertTanstackStatesToColumnConfig,
} from '@shared/util'
import { OverviewSettings, useCreateViewMutation } from '@shared/api'
import { generateWorkingView } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'
import { useMemo, useState, useEffect, useCallback } from 'react'

type Return = {
  columns: ColumnsConfig
  onUpdateColumns: (columns: ColumnsConfig, allColumnIds?: string[]) => void
}

export const usePageViewColumns = (): Return => {
  // this views context is per page/project
  const {
    viewSettings,
    viewType,
    projectName,
    setSelectedView,
    selectedView,
    workingView,
    onSettingsChanged,
  } = useViewsContext()

  // Local state for immediate updates
  const [localColumns, setLocalColumns] = useState<ColumnsConfig | null>(null)

  // MUTATIONS
  const [createView] = useCreateViewMutation()

  // Convert server settings to columns format
  const serverColumns = useMemo(
    () => convertColumnConfigToTanstackStates(viewSettings as OverviewSettings),
    [JSON.stringify(viewSettings)],
  )

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalColumns(null) // Reset local state when server data changes
  }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const columns = localColumns || serverColumns

  const onUpdateColumns = useCallback(
    async (tableSettings: ColumnsConfig, allColumnIds?: string[]) => {
      try {
        if (!viewType) throw 'No view type provided for updating columns'

        // Immediately update local state for fast UI response
        setLocalColumns(tableSettings)

        // convert the columns to settings format
        const settings = convertTanstackStatesToColumnConfig(tableSettings, allColumnIds)

        // always update the working view no matter what
        const newWorkingView = generateWorkingView({ ...viewSettings, ...settings })
        // only use the generated ID if there is no working view already
        const newWorkingViewId = workingView?.id || newWorkingView.id

        // Make API call in background
        const promise = createView({
          payload: newWorkingView,
          viewType: viewType,
          projectName: projectName,
        }).unwrap()

        // if not working: set that the settings have been changed to show the little blue save button
        if (selectedView && !selectedView.working) {
          onSettingsChanged(true)
        }
        // Always switch to the working view after updating anything
        setSelectedView(newWorkingViewId as string)

        await promise

        // Clear local state after successful API call - the server data will take over
        setLocalColumns(null)
      } catch (error) {
        // Revert local state on error
        setLocalColumns(null)
        toast.error(`Failed to update columns: ${error}`)
      }
    },
    [
      viewType,
      viewSettings,
      workingView,
      projectName,
      selectedView,
      createView,
      setSelectedView,
      onSettingsChanged,
    ],
  )

  return {
    columns,
    onUpdateColumns,
  }
}
