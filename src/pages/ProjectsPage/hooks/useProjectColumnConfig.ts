import { useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import {
  convertColumnConfigToTanstackStates,
  convertTanstackStatesToColumnConfig,
} from '@shared/util'
import type { OverviewSettings } from '@shared/api/generated/views'
import { ColumnOrderState, ColumnSizingState, VisibilityState } from '@tanstack/react-table'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ProjectColumn } from './useProjectColumns'

type Props = {
  columns: ProjectColumn[]
}

/**
 * Consolidated hook for managing all column config (order, visibility, sizing) in ProjectsPage.
 * Keeps them in sync so each handler preserves the other two values when saving to views.
 */
export const useProjectColumnConfig = ({ columns }: Props) => {
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()

  const [localColumnOrder, setLocalColumnOrder] = useState<ColumnOrderState | null>(null)
  const [localColumnVisibility, setLocalColumnVisibility] = useState<VisibilityState | null>(null)
  const [localColumnSizing, setLocalColumnSizing] = useState<ColumnSizingState | null>(null)

  const storedConfig = useMemo(() => {
    const settings = viewSettings as OverviewSettings | undefined
    if (!settings?.columns?.length) return null
    return convertColumnConfigToTanstackStates(settings)
  }, [viewSettings])

  const columnOrder = localColumnOrder ?? storedConfig?.columnOrder
  const columnVisibility: VisibilityState =
    localColumnVisibility ?? storedConfig?.columnVisibility ?? {}
  const columnSizing: ColumnSizingState = localColumnSizing ?? storedConfig?.columnSizing ?? {}

  // Refs always hold the latest effective values — avoids stale closures in callbacks
  const columnOrderRef = useRef<ColumnOrderState>(columnOrder ?? [])
  const columnVisibilityRef = useRef<VisibilityState>(columnVisibility)
  const columnSizingRef = useRef<ColumnSizingState>(columnSizing)
  columnOrderRef.current = columnOrder ?? []
  columnVisibilityRef.current = columnVisibility
  columnSizingRef.current = columnSizing

  const getFinalVisibility = useCallback(
    (overrides: VisibilityState) => {
      const final: VisibilityState = {}
      columns.forEach((col) => {
        if (col.id) {
          final[col.id] = overrides[col.id] ?? col.visible ?? false
        }
      })
      return final
    },
    [columns],
  )

  const allColumnIds = useMemo(() => columns.map((c) => c.id as string), [columns])

  const handleColumnOrderChange = useCallback(
    async (newOrder: ColumnOrderState) => {
      const columnConfig = convertTanstackStatesToColumnConfig(
        {
          columnOrder: newOrder,
          columnVisibility: getFinalVisibility(columnVisibilityRef.current),
          columnPinning: {},
          columnSizing: columnSizingRef.current,
        },
        allColumnIds,
      )
      await updateViewSettings({ columns: columnConfig.columns }, setLocalColumnOrder, newOrder, {})
    },
    [allColumnIds, updateViewSettings, getFinalVisibility],
  )

  const handleColumnVisibilityChange = useCallback(
    async (newVisibility: VisibilityState) => {
      const columnConfig = convertTanstackStatesToColumnConfig(
        {
          columnOrder: columnOrderRef.current,
          columnVisibility: getFinalVisibility(newVisibility),
          columnPinning: {},
          columnSizing: columnSizingRef.current,
        },
        allColumnIds,
      )
      await updateViewSettings(
        { columns: columnConfig.columns },
        setLocalColumnVisibility,
        newVisibility,
        {},
      )
    },
    [allColumnIds, updateViewSettings, getFinalVisibility],
  )

  const handleColumnSizingChange = useCallback(
    async (newSizing: ColumnSizingState) => {
      const columnConfig = convertTanstackStatesToColumnConfig(
        {
          columnOrder: columnOrderRef.current,
          columnVisibility: getFinalVisibility(columnVisibilityRef.current),
          columnPinning: {},
          columnSizing: newSizing,
        },
        allColumnIds,
      )
      await updateViewSettings(
        { columns: columnConfig.columns },
        setLocalColumnSizing,
        newSizing,
        {},
      )
    },
    [allColumnIds, updateViewSettings, getFinalVisibility],
  )

  /**
   * Unified handler for when both column order and visibility change atomically
   * (e.g. drag-to-reorder in the settings panel). Sends a single PATCH instead of
   * two separate ones that would race and cause the second to overwrite the first.
   */
  const handleColumnsConfigChange = useCallback(
    async (newOrder: ColumnOrderState, newVisibility: VisibilityState) => {
      const columnConfig = convertTanstackStatesToColumnConfig(
        {
          columnOrder: newOrder,
          columnVisibility: getFinalVisibility(newVisibility),
          columnPinning: {},
          columnSizing: columnSizingRef.current,
        },
        allColumnIds,
      )
      type Combined = { order: ColumnOrderState; visibility: VisibilityState }
      const combinedSetter = (value: Combined | null) => {
        setLocalColumnOrder(value?.order ?? null)
        setLocalColumnVisibility(value?.visibility ?? null)
      }
      await updateViewSettings(
        { columns: columnConfig.columns },
        combinedSetter,
        { order: newOrder, visibility: newVisibility },
        {},
      )
    },
    [allColumnIds, updateViewSettings, getFinalVisibility],
  )

  return {
    columnOrder,
    columnVisibility,
    columnSizing,
    handleColumnOrderChange,
    handleColumnVisibilityChange,
    handleColumnSizingChange,
    handleColumnsConfigChange,
  }
}
