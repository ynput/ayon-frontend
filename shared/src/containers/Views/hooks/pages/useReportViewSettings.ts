/**
 * Unified hook for managing report page view settings.
 *
 * The hook handles:
 * - Slicer row selection state
 * - Slicer expanded state
 * - Slicer slice type (hierarchy, assignees, status, etc.)
 * - Slicer persistent row selection data
 *
 * Must be used within a ViewsProvider context.
 */

import { useViewsContext } from '../../context/ViewsContext'
import { OverviewSettings } from '@shared/api'
import { useViewUpdateHelper } from '../../utils/viewUpdateHelper'
import { useState, useEffect, useCallback } from 'react'
import { RowSelectionState, ExpandedState } from '@tanstack/react-table'
import { SelectionData } from '@shared/containers/Slicer'

interface SlicerSettings {
  rowSelection?: RowSelectionState
  expanded?: ExpandedState
  persistentRowSelectionData?: SelectionData
}

export type ReportViewSettings = {
  // Slicer state management
  rowSelection: RowSelectionState
  onUpdateRowSelection: (rowSelection: RowSelectionState) => void

  expanded: ExpandedState
  onUpdateExpanded: (expanded: ExpandedState) => void

  persistentRowSelectionData: SelectionData
  onUpdatePersistentRowSelectionData: (persistentRowSelectionData: SelectionData) => void
}

export const useReportViewSettings = (): ReportViewSettings => {
  // Get views context
  const { viewSettings } = useViewsContext()

  // Local state for immediate updates
  const [localRowSelection, setLocalRowSelection] = useState<RowSelectionState | null>(null)
  const [localExpanded, setLocalExpanded] = useState<ExpandedState | null>(null)
  const [localPersistentData, setLocalPersistentData] = useState<SelectionData | null>(null)

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  // Get server settings from view
  const overviewSettings = viewSettings as OverviewSettings
  const serverSettings = (overviewSettings as any)?.slicer || {} as SlicerSettings

  // Extract individual settings from server
  const serverRowSelection = (serverSettings.rowSelection as RowSelectionState) || {}
  const serverExpanded = (serverSettings.expanded as ExpandedState) || {}
  const serverPersistentData = (serverSettings.persistentRowSelectionData as SelectionData) || {}

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalRowSelection(null)
    setLocalExpanded(null)
    setLocalPersistentData(null)
  }, [JSON.stringify(viewSettings)])

  // Use local state if available, otherwise use server state
  const rowSelection = localRowSelection !== null ? localRowSelection : serverRowSelection
  const expanded = localExpanded !== null ? localExpanded : serverExpanded
  const persistentRowSelectionData = localPersistentData !== null ? localPersistentData : serverPersistentData

  // Update handlers for each setting
  const onUpdateRowSelection = useCallback(
    async (newRowSelection: RowSelectionState) => {
      const updatedSlicer = {
        ...serverSettings,
        rowSelection: newRowSelection,
      }
      await updateViewSettings(
        { slicer: updatedSlicer },
        setLocalRowSelection,
        newRowSelection,
        { errorMessage: 'Failed to update row selection' }
      )
    },
    [updateViewSettings, serverSettings]
  )

  const onUpdateExpanded = useCallback(
    async (newExpanded: ExpandedState) => {
      const updatedSlicer = {
        ...serverSettings,
        expanded: newExpanded,
      }
      await updateViewSettings(
        { slicer: updatedSlicer },
        setLocalExpanded,
        newExpanded,
        { errorMessage: 'Failed to update expanded state' }
      )
    },
    [updateViewSettings, serverSettings]
  )

  const onUpdatePersistentRowSelectionData = useCallback(
    async (newPersistentData: SelectionData) => {
      const updatedSlicer = {
        ...serverSettings,
        persistentRowSelectionData: newPersistentData,
      }
      await updateViewSettings(
        { slicer: updatedSlicer },
        setLocalPersistentData,
        newPersistentData,
        { errorMessage: 'Failed to update persistent row selection data' }
      )
    },
    [updateViewSettings, serverSettings]
  )

  return {
    rowSelection,
    onUpdateRowSelection,
    expanded,
    onUpdateExpanded,
    persistentRowSelectionData,
    onUpdatePersistentRowSelectionData,
  }
}
