import { useCallback, useMemo, useState } from 'react'
import type { EntityTableColumns } from '@ynput/ayon-addon'
import {
  ENTITY_COLUMN_IDS,
  LIST_COLUMN_IDS,
  type ColumnsConfig,
  type ContextMenuItemConstructors,
  type ProjectTableAttribute,
  type ProjectTableQueriesProviderProps,
} from '@shared/containers/ProjectTreeTable'
import { VP_PARENT_COLUMNS } from '@pages/VersionsProductsPage/components/VPTableSettings/VPTableSettingsHelpers'

// Built-in columns of the Overview and Products tables. The table has no read-only mode of its
// own, so EntityTable lists every column it can show as read-only and drops edits (noUpdate).
const BUILT_IN_COLUMNS = [
  'thumbnail',
  'name',
  'label',
  'entityType',
  'status',
  'subType',
  'assignees',
  'author',
  'version',
  'product',
  'tags',
  'createdAt',
  'updatedAt',
  'subtasks',
  'comments',
  ...Object.values(ENTITY_COLUMN_IDS),
  ...VP_PARENT_COLUMNS.flatMap((column) => (column.id ? [column.id] : [])),
  ...LIST_COLUMN_IDS,
]

export const readOnlyColumns = (attribFields: ProjectTableAttribute[]): string[] => [
  ...BUILT_IN_COLUMNS,
  ...attribFields.map((attrib) => `attrib_${attrib.name}`),
]

// read-only: edits never reach the server
export const noUpdate: ProjectTableQueriesProviderProps['updateEntities'] = async () => undefined

export const NO_CONTEXT_MENU_ITEMS: ContextMenuItemConstructors = []
// what the right-click menu offers in a read-only table
export const READ_ONLY_MENU_ITEMS: ContextMenuItemConstructors = ['copy-paste', 'export', 'open-viewer']

/**
 * The column settings: the `columns` prop when the addon controls them, the table's own state
 * otherwise. Where the rows can't be grouped, a group by in `columns` is ignored and kept as it is.
 */
export const useEntityTableColumns = (
  columns: EntityTableColumns | undefined,
  onColumnsChange: ((columns: EntityTableColumns) => void) | undefined,
  groupByDisabled: boolean,
) => {
  const [ownColumns, setOwnColumns] = useState<EntityTableColumns>({})
  const current = columns ?? ownColumns

  const config = useMemo(
    () => (groupByDisabled && current.groupBy ? { ...current, groupBy: undefined } : current),
    [current, groupByDisabled],
  )

  const onChange = useCallback(
    (next: ColumnsConfig) => {
      const changed = (
        groupByDisabled ? { ...next, groupBy: current.groupBy } : next
      ) as EntityTableColumns
      if (!columns) setOwnColumns(changed)
      onColumnsChange?.(changed)
    },
    [columns, current.groupBy, groupByDisabled, onColumnsChange],
  )

  return { config, onChange }
}
