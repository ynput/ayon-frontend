import { ENTITY_COLUMN_IDS, getColumnLabel } from '@shared/containers'
import type { ParentColumnDefinition } from '@shared/containers'

export const VP_PARENT_COLUMNS: ParentColumnDefinition[] = [
  {
    id: 'folder_status',
    scope: 'folder',
    field: 'status',
    label: 'Folder status',
    optionKey: 'folderStatus',
    readOnly: false,
    sortable: false,
    updateField: 'status',
  },
  {
    id: 'folder_subType',
    scope: 'folder',
    field: 'subType',
    label: 'Folder type',
    optionKey: 'folderType',
    updateField: 'folderType',
  },
  {
    id: 'folder_tags',
    scope: 'folder',
    field: 'tags',
    label: 'Folder tags',
    optionKey: 'tag',
    dataType: 'list_of_strings',
    sortable: false,
  },
  {
    id: 'folder_updatedAt',
    scope: 'folder',
    field: 'updatedAt',
    label: 'Folder updated at',
    dataType: 'datetime',
    readOnly: true,
    sortable: false,
  },
  {
    id: 'folder_createdAt',
    scope: 'folder',
    field: 'createdAt',
    label: 'Folder created at',
    dataType: 'datetime',
    readOnly: true,
    sortable: false,
  },
  {
    id: 'task_subType',
    scope: 'task',
    field: 'subType',
    label: 'Task type',
    optionKey: 'taskType',
    updateField: 'taskType',
  },
  {
    id: 'task_status',
    scope: 'task',
    field: 'status',
    label: 'Task status',
    optionKey: 'taskStatus',
    readOnly: false,
    sortable: false,
  },
  {
    id: 'product_productBaseType',
    scope: 'product',
    field: 'productBaseType',
    label: 'Product base type',
    fallbackToPrimary: true,
    readOnly: true,
  },
]

export const VP_COLUMN_ID_ALIASES = {
  productBaseType: 'product_productBaseType',
  taskType: 'task_subType',
  folderType: 'folder_subType',
  folderStatus: 'folder_status',
  taskLabel: 'task_entity',
}

export const VP_EXTRA_COLUMNS = [
  {
    value: 'author',
    label: getColumnLabel('author'),
  },
  {
    value: 'version',
    label: getColumnLabel('version'),
  },
  {
    value: ENTITY_COLUMN_IDS.version,
    label: getColumnLabel(ENTITY_COLUMN_IDS.version),
  },
]
