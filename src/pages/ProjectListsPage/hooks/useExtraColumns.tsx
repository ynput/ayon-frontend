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

  // plain readonly value columns only available on version lists

  const versionValueColumns = useMemo<
    { value: string; label: string; position: number; optionsKey?: TreeTableSubType }[]
  >(
    () =>
      entityType === 'version'
        ? [
            {
              value: 'productBaseType',
              label: 'Base type',
              position: 9,
              optionsKey: 'productType',
            },
            { value: 'taskLabel', label: 'Task', position: 10 },
          ]
        : [],
    [entityType],
  )

  const extraColumns: TreeTableExtraColumn[] = useMemo(
    () => [
      ...versionValueColumns.map(
        (valueColumn): TreeTableExtraColumn => ({
          column: {
            id: valueColumn.value,
            accessorKey: valueColumn.value,
            header: valueColumn.label,
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
                  className={clsx(valueColumn.value, { loading: row.original.isLoading })}
                  columnId={column.id}
                  value={isEntityRestricted(type) ? '' : value}
                  options={
                    valueColumn.optionsKey && !isEntityRestricted(type)
                      ? meta?.options?.[valueColumn.optionsKey]
                      : undefined
                  }
                  attributeData={{ type: 'string' }}
                  isReadOnly={true}
                />
              )
            },
          },
          position: valueColumn.position,
        }),
      ),
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
    [extraTypeColumns, versionValueColumns],
  )

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

  const extraColumnsSettings = [...extraTypeColumns, ...versionValueColumns, ...versionExtraColumns]

  return {
    extraColumns,
    extraColumnsSettings,
  }
}

export default useExtraColumns
