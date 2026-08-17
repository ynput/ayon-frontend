import type { EntityType, ParentColumnDefinition, TreeTableExtraColumn } from '@shared/containers'
import { useMemo } from 'react'
import { ListEntityType } from '../components/NewListDialog/NewListDialog'

export const LISTS_COLUMN_ID_ALIASES = {
  folderType: 'folder_subType',
  taskType: 'task_subType',
  productType: 'product_subType',
  productBaseType: 'product_productBaseType',
}

interface useExtraColumnsProps {
  entityType?: ListEntityType
}

const useExtraColumns = ({ entityType }: useExtraColumnsProps) => {
  const parentColumns = useMemo<ParentColumnDefinition[]>(() => {
    const folderType: ParentColumnDefinition = {
      id: 'folder_subType',
      scope: 'folder',
      field: 'subType',
      label: 'Folder type',
      optionKey: 'folderType',
      readOnly: entityType !== 'folder',
      includeAttributes: false,
      updateField: 'folderType',
      fallbackToPrimary: entityType === 'folder',
    }
    const taskType: ParentColumnDefinition = {
      id: 'task_subType',
      scope: 'task',
      field: 'subType',
      label: 'Task type',
      optionKey: 'taskType',
      readOnly: entityType !== 'task',
      includeAttributes: false,
      updateField: 'taskType',
      fallbackToPrimary: entityType === 'task',
    }
    const productType: ParentColumnDefinition = {
      id: 'product_subType',
      scope: 'product',
      field: 'subType',
      label: 'Product type',
      optionKey: 'productType',
      readOnly: true,
      includeAttributes: false,
      updateField: 'productType',
    }

    if (entityType === 'folder') return []
    if (entityType === 'task') return [folderType]
    if (entityType === 'version') {
      return [
        productType,
        taskType,
        folderType,
        {
          id: 'product_productBaseType',
          scope: 'product',
          field: 'productBaseType',
          label: 'Base type',
          readOnly: true,
          includeAttributes: false,
          sortable: false,
        },
      ]
    }
    return []
  }, [entityType])

  const includeParents = useMemo<EntityType[]>(() => {
    if (entityType === 'folder') return []
    if (entityType === 'task') return ['folder']
    if (entityType === 'version') return ['product', 'task', 'folder']
    return []
  }, [entityType])

  const extraColumns: TreeTableExtraColumn[] = []

  // some extra columns are added in buildTreeTableColumns based on the entity type
  // (author/version/product are only built for version scope) so only offer them in the
  // column manager for version lists — otherwise the toggle is a no-op (column never builds).
  const versionExtraColumns =
    entityType === 'version'
      ? [
          {
            value: 'author',
            label: 'Author',
            position: 6,
            readonly: true,
          },
          {
            value: 'version',
            label: 'Version',
            position: 7,
            readonly: true,
          },
          {
            value: 'product',
            label: 'Product',
            position: 8,
            readonly: true,
          },
        ]
      : []

  const extraColumnsSettings = versionExtraColumns

  return {
    extraColumns,
    extraColumnsSettings,
    parentColumns,
    includeParents,
    columnIdAliases: LISTS_COLUMN_ID_ALIASES,
  }
}

export default useExtraColumns
