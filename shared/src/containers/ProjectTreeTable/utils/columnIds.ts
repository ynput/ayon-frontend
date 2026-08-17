import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import type { ColumnsConfig } from '../context/ColumnSettingsContext'

export const ENTITY_COLUMN_IDS = {
  folder: 'folder_entity',
  task: 'task_entity',
  version: 'version_entity',
} as const

// These ids were persisted by older table settings.
export const LEGACY_COLUMN_ID_ALIASES: Record<string, string> = {
  folder: ENTITY_COLUMN_IDS.folder,
  folderName: ENTITY_COLUMN_IDS.folder,
  taskLabel: ENTITY_COLUMN_IDS.task,
  taskName: ENTITY_COLUMN_IDS.task,
}

export const normalizeColumnId = (columnId: string) =>
  LEGACY_COLUMN_ID_ALIASES[columnId] || columnId

export const normalizeColumnIdList = (columnIds: string[] = []): string[] =>
  Array.from(new Set(columnIds.map(normalizeColumnId)))

const normalizeColumnRecord = <T>(record: Record<string, T> = {}): Record<string, T> => {
  const normalized: Record<string, T> = {}

  // Keep an explicitly saved canonical value when both ids are present.
  Object.entries(record).forEach(([columnId, value]) => {
    const normalizedId = normalizeColumnId(columnId)
    if (normalized[normalizedId] === undefined || normalizedId === columnId) {
      normalized[normalizedId] = value
    }
  })

  return normalized
}

export const normalizeColumnsConfig = (config?: ColumnsConfig): ColumnsConfig => {
  if (!config) return {} as ColumnsConfig

  const columnPinning: ColumnPinningState = {
    ...config.columnPinning,
    left: normalizeColumnIdList(config.columnPinning?.left),
    right: normalizeColumnIdList(config.columnPinning?.right),
  }

  const columnSizing: ColumnSizingState = normalizeColumnRecord(config.columnSizing)
  const columnVisibility: VisibilityState = normalizeColumnRecord(config.columnVisibility)
  const columnOrder: ColumnOrderState = normalizeColumnIdList(config.columnOrder)
  const sorting: SortingState | undefined = config.sorting?.map((sort) => ({
    ...sort,
    id: normalizeColumnId(sort.id),
  }))

  return {
    ...config,
    columnOrder,
    columnPinning,
    columnSizing,
    columnVisibility,
    sorting,
    columnSummaries: normalizeColumnRecord(config.columnSummaries),
    columnSummaryScopes: normalizeColumnRecord(config.columnSummaryScopes),
    columnSummaryFormats: normalizeColumnRecord(config.columnSummaryFormats),
  }
}
