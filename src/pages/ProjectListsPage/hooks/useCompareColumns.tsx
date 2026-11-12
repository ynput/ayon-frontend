import { useMemo } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import {
  CellWidget,
  checkColumnVisibility,
  COLUMN_MIN_SIZE,
  type ProjectDataContextProps,
  type TreeTableExtraColumn,
} from '@shared/containers/ProjectTreeTable'
import { isEntityRestricted } from '@shared/containers/ProjectTreeTable/utils/restrictedEntity'
import { useProjectContext } from '@shared/context'
import { useAttributeEnums } from '@shared/hooks/useAttributeEnums'
import { toDropdownErrorText } from '@shared/util/attributeEnum'
import { COMPARE_ENTITY_COLUMN_PREFIX, COMPARE_LIST_COLUMN_PREFIX } from '../listValues/columns'
import type { ListValueComparison } from '../listValues/types'

type Props = {
  attribFields: ProjectDataContextProps['attribFields'] // the entity type's attributes
  compareValues?: Map<string, Record<string, ListValueComparison>>
  compareLabel?: string // 'Entity' or the compared list's name
  withEntities: boolean // comparing with the entities, not another list
  entityReadOnly?: boolean // the entities' attributes can't be changed from this list
  columnVisibility: VisibilityState
  defaultColumnVisibility?: VisibilityState
}

// Compare view: a column after each visible attribute column with the compared value
const useCompareColumns = ({
  attribFields,
  compareValues,
  compareLabel,
  withEntities,
  entityReadOnly,
  columnVisibility,
  defaultColumnVisibility,
}: Props) => {
  const { projectName } = useProjectContext()
  const comparedAttribs = useMemo(
    () =>
      compareValues
        ? attribFields.filter((attrib) =>
            checkColumnVisibility(
              columnVisibility,
              `attrib_${attrib.name}`,
              defaultColumnVisibility,
            ),
          )
        : [],
    [attribFields, compareValues, columnVisibility, defaultColumnVisibility],
  )
  // enum options from resolvers, like the table's own attribute columns
  const resolvedAttribs = useAttributeEnums(comparedAttribs, { projectName })

  const compareColumns = useMemo<TreeTableExtraColumn[]>(() => {
    if (!compareValues) return []
    const prefix = withEntities ? COMPARE_ENTITY_COLUMN_PREFIX : COMPARE_LIST_COLUMN_PREFIX

    return resolvedAttribs.map((attrib) => ({
      after: `attrib_${attrib.name}`,
      column: {
        id: prefix + attrib.name,
        header: `${attrib.data.title || attrib.name} · ${compareLabel}`,
        accessorFn: (row) => compareValues.get(row.id)?.[attrib.name]?.value,
        minSize: COLUMN_MIN_SIZE,
        enableSorting: withEntities,
        enableResizing: true,
        enableHiding: false,
        enablePinning: false,
        cell: ({ row, column, table }) => {
          const entity = row.original.primary
          if (row.original.group || row.original.metaType || isEntityRestricted(entity.entityType))
            return null
          const comparison = compareValues.get(row.id)?.[attrib.name]
          if (!comparison) return null

          if (comparison.missing) {
            return (
              <CellWidget
                rowId={row.id}
                columnId={column.id}
                value={'Not in list'}
                attributeData={{ type: 'string' }}
                isInherited
                isReadOnly
              />
            )
          }

          const isReadOnly = !withEntities || !!entityReadOnly || !!attrib.readOnly
          return (
            <CellWidget
              rowId={row.id}
              columnId={column.id}
              className="attrib"
              value={comparison.value as any}
              attributeData={{
                type: attrib.data.type || 'string',
                widget: attrib.data.widget,
                enumResolver: attrib.data.enumResolver,
              }}
              options={attrib.data.enum || []}
              isLoadingOptions={!!attrib.enumIsLoading}
              tooltip={attrib.enumError}
              pt={{ enum: { error: toDropdownErrorText(attrib.enumError) } }}
              isInherited={comparison.isInherited}
              isReadOnly={isReadOnly}
              mark={{
                highlight: comparison.highlight,
                warning: comparison.duplicated,
                tooltip: comparison.duplicated
                  ? `Listed more than once in ${compareLabel}, showing the first`
                  : undefined,
              }}
              onChange={(value) =>
                !isReadOnly &&
                table.options.meta?.updateEntities?.({
                  field: attrib.name,
                  value,
                  type: entity.entityType,
                  id: entity.id,
                  isAttrib: true,
                  rowId: row.id,
                  entityData: entity,
                  meta: { listValueTarget: 'entity' },
                })
              }
            />
          )
        },
      },
    }))
  }, [resolvedAttribs, compareValues, compareLabel, withEntities, entityReadOnly])

  const compareColumnIds = useMemo(
    () => compareColumns.map(({ column }) => column.id as string),
    [compareColumns],
  )

  return { compareColumns, compareColumnIds }
}

export default useCompareColumns
