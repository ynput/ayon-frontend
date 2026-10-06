import type { ColumnOrderState, ColumnPinningState, VisibilityState } from '@tanstack/react-table'
import { checkColumnVisibility } from '../ProjectTreeTable/utils/checkColumnVisibility'
import { normalizeColumnId } from '../ProjectTreeTable/utils/columnIds'
import { ROW_SELECTION_COLUMN_ID, DRAG_HANDLE_COLUMN_ID } from '../ProjectTreeTable/constants'
import {
  COLUMN_LABELS,
  getColumnLabel,
  getNameColumnLabel,
} from '../ProjectTreeTable/buildTreeTableColumns'
import type { ProjectTableAttribute } from '../ProjectTreeTable/types'

// the type column: folder or task type in the hierarchy, product type for products
export type SubTypeKey = 'folder_or_task_type' | 'product_type'

// table column id -> export column key (POST /api/csv/table/export)
const COLUMN_KEYS: Record<string, string> = {
  name: 'name',
  status: 'status',
  entityType: 'entity_type',
  assignees: 'assignees',
  tags: 'tags',
  author: 'author',
  version: 'version',
  version_entity: 'version',
  product: 'product',
  productType: 'product_type',
  productBaseType: 'product_base_type',
  folder_entity: 'folder',
  task_entity: 'task',
  folderType: 'folder_type',
  taskType: 'task_type',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // parent columns
  folder_subType: 'folder_type',
  task_subType: 'task_type',
  product_subType: 'product_type',
  product_productBaseType: 'product_base_type',
}

const NOT_DATA_COLUMNS = [ROW_SELECTION_COLUMN_ID, DRAG_HANDLE_COLUMN_ID]

export const getExportColumnKey = (columnId: string, subTypeKey: SubTypeKey) => {
  const id = normalizeColumnId(columnId)
  if (id === 'subType') return subTypeKey
  if (id.startsWith('attrib_')) return `attrib.${id.slice('attrib_'.length)}`
  return COLUMN_KEYS[id]
}

// parent entity columns, e.g. folder_subType or task_attrib_priority
const PARENT_COLUMN = /^(folder|task|product|version)_(.+)$/

export const getExportColumnLabel = (
  columnId: string,
  { attribFields, scopes }: { attribFields: ProjectTableAttribute[]; scopes: string[] },
): string => {
  const id = normalizeColumnId(columnId)
  if (id === 'name') return getNameColumnLabel(scopes)
  if (id.startsWith('attrib_')) {
    const name = id.slice('attrib_'.length)
    return attribFields.find((field) => field.name === name)?.data.title || name
  }
  const parent = id.match(PARENT_COLUMN)
  if (parent && !(id in COLUMN_LABELS)) {
    const [, scope, field] = parent
    const label = getExportColumnLabel(field, { attribFields, scopes: [scope] })
    return `${scope.charAt(0).toUpperCase()}${scope.slice(1)} ${label.toLowerCase()}`
  }
  return getColumnLabel(id, scopes)
}

// the data columns the table shows, in its order (left pinned columns first)
export const getVisibleColumnIds = ({
  allColumns,
  columnOrder,
  columnPinning,
  columnVisibility,
  defaultColumnVisibility,
}: {
  allColumns: string[]
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  columnVisibility: VisibilityState
  defaultColumnVisibility?: VisibilityState
}): string[] => {
  const known = allColumns.length ? allColumns : columnOrder
  // columns missing from the saved order follow in definition order
  const ordered = Array.from(new Set([...columnOrder.filter((id) => known.includes(id)), ...known]))
  const left = (columnPinning.left || []).filter((id) => ordered.includes(id))
  return [...left, ...ordered.filter((id) => !left.includes(id))].filter(
    (id) =>
      !NOT_DATA_COLUMNS.includes(id) &&
      checkColumnVisibility(columnVisibility, id, defaultColumnVisibility),
  )
}
