import type { ColumnOrderState, ColumnPinningState, VisibilityState } from '@tanstack/react-table'
import type { LinkTypeModel } from '@shared/api'
import { checkColumnVisibility } from '../ProjectTreeTable/utils/checkColumnVisibility'
import { normalizeColumnId } from '../ProjectTreeTable/utils/columnIds'
import { parseScopedColumnId } from '../ProjectTreeTable/utils/cellUtils'
import { ROW_SELECTION_COLUMN_ID, DRAG_HANDLE_COLUMN_ID } from '../ProjectTreeTable/constants'
import {
  COLUMN_LABELS,
  getColumnLabel,
  getLinkColumnId,
  getLinkLabel,
  getNameColumnLabel,
  getScopedHeader,
} from '../ProjectTreeTable/buildTreeTableColumns'
import type { ParentColumnDefinition, ProjectTableAttribute } from '../ProjectTreeTable/types'

// the type column: folder or task type in the hierarchy, product type for products
export type SubTypeKey = 'folder_or_task_type' | 'product_type'

// table column id -> export column key (POST /api/export-table)
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
}

// Parent columns (folder_status, product_attrib_x) export as `<scope>.<key>`, only for the
// fields the server reads from a row's folder, task or product.
const PARENT_KEYS: Record<string, Record<string, string>> = {
  folder: { subType: 'folder_type' },
  task: { subType: 'task_type' },
  product: { subType: 'product_type', productBaseType: 'product_base_type' },
}
const PARENT_FIELD_KEYS: Record<string, string> = {
  status: 'status',
  tags: 'tags',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

const NOT_DATA_COLUMNS = [ROW_SELECTION_COLUMN_ID, DRAG_HANDLE_COLUMN_ID]

export const getExportColumnKey = (columnId: string, subTypeKey: SubTypeKey) => {
  const id = normalizeColumnId(columnId)
  if (COLUMN_KEYS[id]) return COLUMN_KEYS[id]
  const { scope, field, isAttrib } = parseScopedColumnId(id)
  if (scope === 'primary') {
    if (isAttrib) return `attrib.${field}`
    return field === 'subType' ? subTypeKey : undefined
  }
  if (!PARENT_KEYS[scope]) return undefined
  const key = isAttrib ? `attrib.${field}` : PARENT_KEYS[scope][field] || PARENT_FIELD_KEYS[field]
  return key && `${scope}.${key}`
}

type LabelContext = {
  attribFields: ProjectTableAttribute[]
  scopes: string[]
  linkTypes?: Pick<LinkTypeModel, 'name' | 'linkType'>[]
  parentColumns?: Pick<ParentColumnDefinition, 'id' | 'label'>[]
}

// the table's header label of a column
export const getExportColumnLabel = (columnId: string, context: LabelContext): string => {
  const { attribFields, scopes, linkTypes = [], parentColumns = [] } = context
  const id = normalizeColumnId(columnId)
  if (id === 'name') return getNameColumnLabel(scopes)
  const parentColumn = parentColumns.find((column) => column.id === id)
  if (parentColumn) return parentColumn.label
  if (id.startsWith('link_')) {
    for (const link of linkTypes) {
      for (const direction of ['in', 'out']) {
        if (getLinkColumnId(link, direction) === id) return getLinkLabel(link, direction)
      }
    }
    return id
  }
  if (id in COLUMN_LABELS) return getColumnLabel(id, scopes)
  const { scope, field, isAttrib } = parseScopedColumnId(id)
  const label = isAttrib
    ? attribFields.find((attrib) => attrib.name === field)?.data.title || field
    : getColumnLabel(field, scope === 'primary' ? scopes : [scope])
  return getScopedHeader(scope, label)
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
