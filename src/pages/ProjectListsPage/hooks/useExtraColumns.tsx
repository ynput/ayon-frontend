import {
  getValueIdType,
  TreeTableExtraColumn,
  TreeTableExtraColumnsConstructor,
  TreeTableSubType,
  useColumnSettings,
} from '@shared/containers'
import { CellWidget } from '@shared/containers/ProjectTreeTable/widgets'
import clsx from 'clsx'
import { useCallback } from 'react'
import { ListEntityType } from '../components/NewListDialog/NewListDialog'

interface useExtraColumnsProps {
  entityType?: ListEntityType
}

const useExtraColumns = ({ entityType }: useExtraColumnsProps) => {
  const { columnSizing } = useColumnSettings()

  const typeColumns: Record<
    TreeTableSubType,
    { value: TreeTableSubType; label: string; position?: number; readonly?: boolean }
  > = {
    productType: { value: 'productType', label: 'Product Type' },
    folderType: { value: 'folderType', label: 'Folder Type' },
    taskType: { value: 'taskType', label: 'Task Type' },
  }

  const extraTypeColumns: (typeof typeColumns)['folderType'][] = []
  switch (entityType) {
    case 'folder':
      extraTypeColumns.push({ ...typeColumns.folderType, position: 3, readonly: false })
      break
    case 'task':
      extraTypeColumns.push({ ...typeColumns.taskType, position: 3, readonly: false })
      extraTypeColumns.push({ ...typeColumns.folderType, position: 4, readonly: true })
      break
    // case 'product':
    //     extraTypeColumns.push(typeColumns.folderType)
    //     break;
    case 'version':
      const basePos = 3
      extraTypeColumns.push({ ...typeColumns.productType, position: basePos, readonly: true })
      extraTypeColumns.push({ ...typeColumns.taskType, position: basePos + 1, readonly: true })
      extraTypeColumns.push({ ...typeColumns.folderType, position: basePos + 2, readonly: true })
      break
    default:
      break
  }

  const extraColumns = useCallback<TreeTableExtraColumnsConstructor>(
    ({ options, updateEntities }) => [
      ...extraTypeColumns.map(
        (typeColumn): TreeTableExtraColumn => ({
          column: {
            id: typeColumn.value,
            accessorKey: typeColumn.value,
            header: typeColumn.label,
            size: columnSizing[typeColumn.value] || 150,
            enableSorting: true,
            enableResizing: true,
            enablePinning: true,
            enableHiding: true,
            cell: ({ row, column }) => {
              const { value, id, type } = getValueIdType(row, column.id)
              return (
                <CellWidget
                  rowId={id}
                  className={clsx(typeColumn.value, { loading: row.original.isLoading })}
                  columnId={column.id}
                  value={value}
                  options={options[typeColumn.value]}
                  attributeData={{ type: 'string' }}
                  isReadOnly={typeColumn.readonly}
                  onChange={(value) =>
                    updateEntities([{ field: typeColumn.value, value, id, type }])
                  }
                />
              )
            },
          },
          position: typeColumn.position,
        }),
      ),
    ],
    [extraTypeColumns],
  )

  const extraColumnsSettings = [...extraTypeColumns]

  return {
    extraColumns,
    extraColumnsSettings,
  }
}

export default useExtraColumns
