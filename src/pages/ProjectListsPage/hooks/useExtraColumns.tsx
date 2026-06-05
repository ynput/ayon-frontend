import { getValueIdType, TreeTableExtraColumn, TreeTableSubType } from '@shared/containers'
import { CellWidget } from '@shared/containers/ProjectTreeTable'
import clsx from 'clsx'
import { useMemo } from 'react'
import { ListEntityType } from '../components/NewListDialog/NewListDialog'
import { isEntityRestricted } from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'

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
                  value={isEntityRestricted(type) ? '' : value}
                  options={isEntityRestricted(type) ? [] : meta?.options?.[typeColumn.value]}
                  attributeData={{ type: 'string' }}
                  isReadOnly={
                    typeColumn.readonly ||
                    meta?.readOnly?.includes(column.id) ||
                    isEntityRestricted(type)
                  }
                  onChange={(value) =>
                    meta?.updateEntities?.([
                      { field: typeColumn.value, value, id, type, rowId: row.id },
                    ])
                  }
                  pt={{
                    enum: {
                      pt: {
                        template: {
                          iconOnlyColor: true,
                        },
                      },
                    },
                  }}
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

  // some extra columns are added in the buildTeeTableColumns based on the entity type
  // so we just need to add them to the settings so they show up in the column manager
  const versionExtraColumns = [
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

  const extraColumnsSettings = [...extraTypeColumns, ...versionExtraColumns]

  return {
    extraColumns,
    extraColumnsSettings,
  }
}

export default useExtraColumns
