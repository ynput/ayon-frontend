import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import type { Column, Row } from '@tanstack/react-table'
import { ContributionErrorBoundary, ContributionView } from '@ynput/ayon-addon'
import type { EntityRef, TableColumnDataHook } from '@ynput/ayon-addon'
import { usePiece } from '@ynput/ayon-addon/host'
import { Icon } from '@ynput/ayon-react-components'
import { useProjectContext } from '@shared/context'
import type { TableRow } from '../types'
import type { AddonColumnMeta } from './addonColumnsHelpers'
import { AddonColumnDataContext, useAddonColumnValue } from './AddonColumnDataContextInstance'
import type { AddonColumnData } from './AddonColumnDataContextInstance'

// a crashed cell: a small mark, the error in its tooltip and the console
const CellError = ({ error }: { error: Error }) => (
  <div className="readonly" data-tooltip={error.message} style={{ justifyContent: 'center' }}>
    <Icon icon="error" style={{ color: 'var(--md-sys-color-error)' }} />
  </div>
)

interface AddonColumnCellProps extends AddonColumnMeta {
  columnId: string
  row: Row<TableRow>
}

// one cell of an addon column: the host's read-only placeholder for groups, loading rows and other
// entity types; the addon's cell (loaded with the table) for the rest
export const AddonColumnCell = ({ contribution, page, columnId, row }: AddonColumnCellProps) => {
  const { projectName } = useProjectContext()
  const { primary, group, metaType, isLoading } = row.original
  const applies =
    !group &&
    !metaType &&
    !isLoading &&
    (!contribution.entityTypes?.length || contribution.entityTypes.includes(primary.entityType))
  const value = useAddonColumnValue(columnId, primary.id)

  const context = useMemo(
    () => ({
      projectName,
      page,
      value,
      entity: {
        id: primary.id,
        entityType: primary.entityType,
        projectName,
        name: primary.name,
        label: primary.label || undefined,
      },
    }),
    [projectName, page, value, primary.id, primary.entityType, primary.name, primary.label],
  )

  if (!applies) return <div className={isLoading ? 'readonly loading' : 'readonly'} />
  return (
    <ContributionView
      contribution={contribution}
      piece="cell"
      context={context}
      loading={<div className="readonly loading" />}
      error={(error) => <CellError error={error} />}
    />
  )
}

// calls the column's useData hook; mounted only once the hook has loaded, so the hook never
// swaps under a mounted component
const RunDataHook = ({
  useData,
  columnId,
  args,
  onData,
}: {
  useData: TableColumnDataHook
  columnId: string
  args: Parameters<TableColumnDataHook>[0]
  onData: (columnId: string, data: Record<string, unknown> | undefined) => void
}) => {
  const data = useData(args)
  useEffect(() => {
    onData(columnId, data)
  }, [columnId, data, onData])
  return null
}

const ColumnDataLoader = ({
  meta,
  columnId,
  entities,
  onData,
}: {
  meta: AddonColumnMeta
  columnId: string
  entities: EntityRef[]
  onData: (columnId: string, data: Record<string, unknown> | undefined) => void
}) => {
  const { projectName } = useProjectContext()
  const { value: useData } = usePiece(meta.contribution.useData)
  const args = useMemo(
    () => ({ projectName, page: meta.page, entities }),
    [projectName, meta.page, entities],
  )
  if (!useData) return null
  return (
    <ContributionErrorBoundary contribution={meta.contribution as never} fallback={() => null}>
      <RunDataHook useData={useData} columnId={columnId} args={args} onData={onData} />
    </ContributionErrorBoundary>
  )
}

/**
 * Runs the useData hook of every shown addon column once for the rows on screen, and gives the
 * results to the cells. Wraps the table body.
 */
export const AddonColumnDataScope = ({
  columns,
  entities,
  children,
}: {
  columns: Column<TableRow>[]
  entities: TableRow['primary'][]
  children: ReactNode
}) => {
  const { projectName } = useProjectContext()
  const [data, setData] = useState<AddonColumnData>({})
  const onData = useCallback(
    (columnId: string, columnData: Record<string, unknown> | undefined) =>
      setData((current) =>
        current[columnId] === columnData ? current : { ...current, [columnId]: columnData },
      ),
    [],
  )

  const dataColumns = columns.flatMap((column) => {
    const meta = column.columnDef.meta?.addonColumn
    return meta?.contribution.useData ? [{ columnId: column.id, meta }] : []
  })

  // one array per set of rows, not per render: useData would refetch otherwise
  const entitiesKey = entities.map((entity) => `${entity.entityType}:${entity.id}`).join(',')
  const entityRefs = useMemo<EntityRef[]>(
    () =>
      entities.map((entity) => ({
        id: entity.id,
        entityType: entity.entityType,
        projectName,
        name: entity.name,
        label: entity.label || undefined,
      })),
    // entities is compared by content
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entitiesKey, projectName],
  )

  return (
    <AddonColumnDataContext.Provider value={data}>
      {dataColumns.map(({ columnId, meta }) => (
        <ColumnDataLoader
          key={columnId}
          meta={meta}
          columnId={columnId}
          entities={entityRefs}
          onData={onData}
        />
      ))}
      {children}
    </AddonColumnDataContext.Provider>
  )
}

