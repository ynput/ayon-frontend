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

export type ColumnIdAliases = Record<string, string>

export const normalizeColumnId = (columnId: string, aliases: ColumnIdAliases = {}) =>
  aliases[columnId] || LEGACY_COLUMN_ID_ALIASES[columnId] || columnId

export const normalizeColumnIdList = (
  columnIds: string[] = [],
  aliases: ColumnIdAliases = {},
): string[] =>
  Array.from(new Set(columnIds.map((columnId) => normalizeColumnId(columnId, aliases))))

const normalizeColumnRecord = <T>(
  record: Record<string, T> = {},
  aliases: ColumnIdAliases = {},
): Record<string, T> => {
  const normalized: Record<string, T> = {}

  // Keep an explicitly saved canonical value when both ids are present.
  Object.entries(record).forEach(([columnId, value]) => {
    const normalizedId = normalizeColumnId(columnId, aliases)
    if (normalized[normalizedId] === undefined || normalizedId === columnId) {
      normalized[normalizedId] = value
    }
  })

  return normalized
}

export const normalizeColumnsConfig = (
  config?: ColumnsConfig,
  aliases: ColumnIdAliases = {},
): ColumnsConfig => {
  if (!config) return {} as ColumnsConfig

  const columnPinning: ColumnPinningState = {
    ...config.columnPinning,
    left: normalizeColumnIdList(config.columnPinning?.left, aliases),
    right: normalizeColumnIdList(config.columnPinning?.right, aliases),
  }

  const columnSizing: ColumnSizingState = normalizeColumnRecord(config.columnSizing, aliases)
  const columnVisibility: VisibilityState = normalizeColumnRecord(config.columnVisibility, aliases)
  const columnOrder: ColumnOrderState = normalizeColumnIdList(config.columnOrder, aliases)
  const sorting: SortingState | undefined = config.sorting?.map((sort) => ({
    ...sort,
    id: normalizeColumnId(sort.id, aliases),
  }))

  return {
    ...config,
    columnOrder,
    columnPinning,
    columnSizing,
    columnVisibility,
    sorting,
    columnSummaries: normalizeColumnRecord(config.columnSummaries, aliases),
    columnSummaryScopes: normalizeColumnRecord(config.columnSummaryScopes, aliases),
    columnSummaryFormats: normalizeColumnRecord(config.columnSummaryFormats, aliases),
  }
}
