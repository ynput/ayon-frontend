/**
 * Column Configuration System
 *
 * Extensible configuration for controlling column and widget behavior.
 * Supports per-column configuration for display, behavior, styling, and other settings.
 */

import type { ColumnMenuItemType } from '@shared/components/ColumnHeaderMenuUI'

export type DisplayConfig = Record<string, boolean>

export type ColumnConfig = {
  display?: DisplayConfig
  headerIcon?: { icon: string; tooltip?: string } // icon next to the column header
  groupEdge?: 'start' | 'end' // thicker outer edge binding the column to its neighbour
  menuItems?: ColumnMenuItemType[] // extra items at the end of the column header menu
}

export type ColumnsConfig = Record<string, ColumnConfig>

export const getDisplayValue = (
  displayConfig: DisplayConfig | undefined,
  propertyName: string,
  layout?: 'compact' | 'full',
): boolean | undefined => {
  if (!displayConfig) return undefined

  // Check layout-specific key first (e.g., 'path_compact')
  if (layout) {
    const layoutKey = `${propertyName}_${layout}`
    if (layoutKey in displayConfig) {
      return displayConfig[layoutKey]
    }
  }

  // Fall back to general key (e.g., 'path')
  if (propertyName in displayConfig) {
    return displayConfig[propertyName]
  }

  return undefined
}

export const getColumnConfig = (
  columnsConfig: ColumnsConfig | undefined,
  columnId: string,
): ColumnConfig | undefined => {
  if (!columnsConfig) return undefined
  return columnsConfig[columnId]
}

export const getColumnDisplayConfig = (
  columnsConfig: ColumnsConfig | undefined,
  columnId: string,
): DisplayConfig | undefined => {
  if (!columnsConfig) return undefined
  const config = columnsConfig[columnId]
  return config?.display
}
