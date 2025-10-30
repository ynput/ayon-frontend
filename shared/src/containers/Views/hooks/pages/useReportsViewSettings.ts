/**
 * Unified hook for managing reports page view settings.
 *
 * The hook handles:
 * - Widgets configuration (from reports addon)
 * - Time format preference
 * - Slicer row selection state
 * - Slicer expanded state
 * - Slicer slice type (hierarchy, assignees, status, etc.)
 * - Slicer persistent row selection data
 *
 * Must be used within a ViewsProvider context.
 */

import { useViewsContext } from '../../context/ViewsContext'
import { ReportsSettings } from '@shared/api'
import { useViewUpdateHelper } from '../../utils/viewUpdateHelper'
import { useState, useEffect, useCallback } from 'react'
import { RowSelectionState, ExpandedState } from '@tanstack/react-table'
import { SelectionData } from '@shared/containers/Slicer'

interface SlicerSettings {
  rowSelection?: RowSelectionState
  expanded?: ExpandedState
  persistentRowSelectionData?: SelectionData
}

export type ViewData = {
  widgets?: any[]
  dateFormat?: string
}

export type ReportsViewSettings = {
  // Reports-specific settings
  widgets: any[]
  dateFormat: string
  onUpdateWidgets: (viewData: ViewData) => void
  onUpdateDateFormat: (viewData: ViewData) => void

  // Slicer state management
  rowSelection: RowSelectionState
  onUpdateRowSelection: (rowSelection: RowSelectionState) => void

  expanded: ExpandedState
  onUpdateExpanded: (expanded: ExpandedState) => void

  persistentRowSelectionData: SelectionData
  onUpdatePersistentRowSelectionData: (persistentRowSelectionData: SelectionData) => void
}

export const useReportsViewSettings = (): ReportsViewSettings => {
  // Get views context
  const { viewSettings } = useViewsContext()

  // Local state for immediate updates
  const [localWidgets, setLocalWidgets] = useState<any[] | null>(null)
  const [localDateFormat, setLocalDateFormat] = useState<string | null>(null)
  const [localRowSelection, setLocalRowSelection] = useState<RowSelectionState | null>(null)
  const [localExpanded, setLocalExpanded] = useState<ExpandedState | null>(null)
  const [localPersistentData, setLocalPersistentData] = useState<SelectionData | null>(null)

  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  // Get server settings from view
  const reportsSettings = viewSettings as ReportsSettings
  const serverWidgets = reportsSettings?.widgets || []
  const serverDateFormat = reportsSettings?.dateFormat || 'us-padded'
  const serverSettings = (reportsSettings as any)?.slicer || {} as SlicerSettings

  // Extract individual settings from server
  const serverRowSelection = (serverSettings.rowSelection as RowSelectionState) || {}
  const serverExpanded = (serverSettings.expanded as ExpandedState) || {}
  const serverPersistentData = (serverSettings.persistentRowSelectionData as SelectionData) || {}

  // Sync local state with server when viewSettings change
  useEffect(() => {
    setLocalWidgets(null)
    setLocalDateFormat(null)
    setLocalRowSelection(null)
    setLocalExpanded(null)
    setLocalPersistentData(null)
  }, [viewSettings])

  // Use local state if available, otherwise use server state
  const widgets = localWidgets !== null ? localWidgets : serverWidgets
  const dateFormat = localDateFormat !== null ? localDateFormat : serverDateFormat
  const rowSelection = localRowSelection !== null ? localRowSelection : serverRowSelection
  const expanded = localExpanded !== null ? localExpanded : serverExpanded
  const persistentRowSelectionData = localPersistentData !== null ? localPersistentData : serverPersistentData

  // Update handlers for each setting
  // Note: The reports addon sends ViewData with { widgets, dateFormat }
  const onUpdateWidgets = useCallback(
    async (viewData: ViewData) => {
      console.log('[useReportsViewSettings] onUpdateWidgets called:', {
        widgetsCount: viewData.widgets?.length,
        dateFormat: viewData.dateFormat,
      })

      const newWidgets = viewData.widgets || []
      const newDateFormat = viewData.dateFormat

      // Update the complete view settings with both values
      const updates: any = { widgets: newWidgets }
      if (newDateFormat !== undefined) {
        updates.dateFormat = newDateFormat
      }

      await updateViewSettings(
        updates,
        setLocalWidgets,
        newWidgets,
        { errorMessage: 'Failed to update widgets' }
      )
    },
    [updateViewSettings]
  )

  const onUpdateDateFormat = useCallback(
    async (viewData: ViewData) => {
      // Extract widgets and dateFormat from the ViewData object sent by the reports addon
      const newDateFormat = viewData.dateFormat || 'us-padded'
      const newWidgets = viewData.widgets

      // Update the complete view settings with both values
      const updates: any = { dateFormat: newDateFormat }
      if (newWidgets !== undefined) {
        updates.widgets = newWidgets
      }

      await updateViewSettings(
        updates,
        setLocalDateFormat,
        newDateFormat,
        { errorMessage: 'Failed to update date format' }
      )
    },
    [updateViewSettings]
  )

  const onUpdateRowSelection = useCallback(
    async (newRowSelection: RowSelectionState) => {
      const currentSettings = (reportsSettings as any)?.slicer || {}
      const updatedSlicer = {
        ...currentSettings,
        rowSelection: newRowSelection,
      }
      await updateViewSettings(
        { slicer: updatedSlicer },
        setLocalRowSelection,
        newRowSelection,
        { errorMessage: 'Failed to update row selection' }
      )
    },
    [updateViewSettings, reportsSettings]
  )

  const onUpdateExpanded = useCallback(
    async (newExpanded: ExpandedState) => {
      const currentSettings = (reportsSettings as any)?.slicer || {}
      const updatedSlicer = {
        ...currentSettings,
        expanded: newExpanded,
      }
      await updateViewSettings(
        { slicer: updatedSlicer },
        setLocalExpanded,
        newExpanded,
        { errorMessage: 'Failed to update expanded state' }
      )
    },
    [updateViewSettings, reportsSettings]
  )

  const onUpdatePersistentRowSelectionData = useCallback(
    async (newPersistentData: SelectionData) => {
      const currentSettings = (reportsSettings as any)?.slicer || {}
      const updatedSlicer = {
        ...currentSettings,
        persistentRowSelectionData: newPersistentData,
      }
      await updateViewSettings(
        { slicer: updatedSlicer },
        setLocalPersistentData,
        newPersistentData,
        { errorMessage: 'Failed to update persistent row selection data' }
      )
    },
    [updateViewSettings, reportsSettings]
  )

  return {
    widgets,
    dateFormat,
    onUpdateWidgets,
    onUpdateDateFormat,
    rowSelection,
    onUpdateRowSelection,
    expanded,
    onUpdateExpanded,
    persistentRowSelectionData,
    onUpdatePersistentRowSelectionData,
  }
}
