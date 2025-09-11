import { getValueIdType, TreeTableExtraColumn, TreeTableSubType } from '@shared/containers'
import { CellWidget } from '@shared/containers/ProjectTreeTable'
import clsx from 'clsx'
import { useMemo } from 'react'
import { ListEntityType } from '../components/NewListDialog/NewListDialog'

const typeColumns: Record<
  TreeTableSubType,
  { value: TreeTableSubType; label: string; position?: number; readonly?: boolean }
> = {
  productType: { value: 'productType', label: 'Product Type' },
  folderType: { value: 'folderType', label: 'Folder Type' },
  taskType: { value: 'taskType', label: 'Task Type' },
}

interface useExtraColumnsProps {
  entityType?: ListEntityType
}

const useExtraColumns = ({ entityType }: useExtraColumnsProps) => {
  const extraTypeColumns = useMemo(
    () =>
      entityType === 'folder'
        ? [{ ...typeColumns.folderType, position: 3, readonly: false }]
        : entityType === 'task'
        ? [
            { ...typeColumns.taskType, position: 3, readonly: false },
            { ...typeColumns.folderType, position: 4, readonly: true },
          ]
        : entityType === 'version'
        ? [
            { ...typeColumns.productType, position: 3, readonly: true },
            { ...typeColumns.taskType, position: 4, readonly: true },
            { ...typeColumns.folderType, position: 5, readonly: true },
          ]
        : [],
    [entityType],
  )

  const extraColumns: TreeTableExtraColumn[] = useMemo(
    () => [
      ...extraTypeColumns.map(
        (typeColumn): TreeTableExtraColumn => ({
          column: {
            id: typeColumn.value,
            accessorKey: typeColumn.value,
            header: typeColumn.label,
            enableSorting: true,
            enableResizing: true,
            enablePinning: true,
            enableHiding: true,
            cell: ({ row, column, table }) => {
              const meta = table.options.meta
              const { value, id, type } = getValueIdType(row, column.id)
              return (
                <CellWidget
                  rowId={id}
                  className={clsx(typeColumn.value, { loading: row.original.isLoading })}
                  columnId={column.id}
                  value={value}
                  options={meta?.options?.[typeColumn.value]}
                  attributeData={{ type: 'string' }}
                  isReadOnly={typeColumn.readonly || meta?.readOnly?.includes(column.id)}
                  onChange={(value) =>
                    meta?.updateEntities?.([
                      { field: typeColumn.value, value, id, type, rowId: row.id },
                    ])
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
