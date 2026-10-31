import { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import type { Column, Row } from '@tanstack/react-table'
import { ContributionView } from '@ynput/ayon-addon'
import type { EntityRef } from '@ynput/ayon-addon'
import { onTableColumnRefresh, reportContributionError, usePiece } from '@ynput/ayon-addon/host'
import { Icon } from '@ynput/ayon-react-components'
import { useProjectContext } from '@shared/context'
import type { TableRow } from '../types'
import type { AddonColumnMeta } from './addonColumnsHelpers'
import { TableCellContent } from '../ProjectTreeTable.styled'
import { getCellId } from '../utils/cellUtils'
import {
  clearAddonColumn,
  getAddonColumnEntry,
  markAddonColumnStale,
  setAddonColumnEntries,
  useAddonColumnEntry,
} from './addonColumnValues'
import type { AddonColumnEntry } from './addonColumnValues'
import { useAddonColumnTagsQuery } from './addonColumnTags'

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
// entity types; the addon's cell (loaded with the table) for the rest. Either sits in the table's
// own cell element (the cell id), so selection, the right-click menu and copy work as in any column.
export const AddonColumnCell = ({ contribution, page, columnId, row }: AddonColumnCellProps) => {
  const { projectName } = useProjectContext()
  const { primary, group, metaType, isLoading } = row.original
  const applies =
    !group &&
    !metaType &&
    !isLoading &&
    (!contribution.entityTypes?.length || contribution.entityTypes.includes(primary.entityType))
  const entry = useAddonColumnEntry(columnId, primary.id)
  const value = entry?.value
  // the first load of a column with fetchValues; a changed entity keeps its value while it loads
  const loading =
    !!contribution.fetchValues && (!entry || (entry.status === 'loading' && !('value' in entry)))

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

  return (
    <TableCellContent
      id={getCellId(row.id, columnId)}
      className={isLoading ? 'readonly loading' : 'readonly'}
      tabIndex={0}
    >
      {applies && entry?.status === 'error' && entry.error ? (
        <CellError error={entry.error} />
      ) : applies && loading ? (
        <div className="readonly loading" />
      ) : (
        applies && (
          <ContributionView
            contribution={contribution}
            piece="cell"
            context={context}
            loading={<div className="readonly loading" />}
            error={(error) => <CellError error={error} />}
          />
        )
      )}
    </TableCellContent>
  )
}

// rows are asked for in batches: once scrolling pauses this long, or when this many are waiting
const BATCH_DELAY = 150
const BATCH_SIZE = 100

type VersionedEntity = EntityRef & { version: string }

// Gets one column's values (its fetchValues piece) for the rows on screen that it has none for,
// or an outdated one (the entity's updatedAt changed, one of its providesTags was invalidated,
// or refreshTableColumn). Results go to the store the cells read; a failed batch shows the error
// in its cells and asks again when they next come on screen.
const ColumnValuesFetcher = ({
  meta,
  columnId,
  entities,
}: {
  meta: AddonColumnMeta
  columnId: string
  entities: VersionedEntity[]
}) => {
  const { projectName } = useProjectContext()
  const { contribution, page } = meta
  const { value: fetchValues } = usePiece(contribution.fetchValues)
  const scope = `${projectName}:${page}`
  const state = useRef({
    pending: new Map<string, VersionedEntity>(),
    onScreen: [] as VersionedEntity[],
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
    controller: new AbortController(),
  })

  // another project or table: what's in flight is dropped, the values start over
  useEffect(() => {
    const current = state.current
    current.controller = new AbortController()
    clearAddonColumn(columnId)
    return () => {
      current.controller.abort()
      clearTimeout(current.timer)
      current.pending.clear()
    }
  }, [columnId, scope])

  const flush = useCallback(() => {
    const current = state.current
    clearTimeout(current.timer)
    current.timer = undefined
    if (!fetchValues) return
    // rows that only flew past while scrolling aren't asked for
    const onScreen = new Set(current.onScreen.map((entity) => entity.id))
    const waiting = [...current.pending.values()].filter((entity) => onScreen.has(entity.id))
    current.pending.clear()
    const { signal } = current.controller

    for (let start = 0; start < waiting.length; start += BATCH_SIZE) {
      const batch = waiting.slice(start, start + BATCH_SIZE)
      const loading: Record<string, AddonColumnEntry> = {}
      batch.forEach(({ id, version }) => {
        const previous = getAddonColumnEntry(columnId, id)
        loading[id] = {
          status: 'loading',
          version,
          ...(previous && 'value' in previous ? { value: previous.value } : {}),
        }
      })
      setAddonColumnEntries(columnId, loading)

      // only what's still the latest ask for that row is kept
      const settle = (entry: (id: string) => Omit<AddonColumnEntry, 'version'>) => {
        if (signal.aborted) return
        const entries: Record<string, AddonColumnEntry> = {}
        batch.forEach(({ id, version }) => {
          if (getAddonColumnEntry(columnId, id)?.version === version) {
            entries[id] = { ...entry(id), version }
          }
        })
        setAddonColumnEntries(columnId, entries)
      }
      const entityRefs = batch.map(
        ({ id, entityType, projectName, name, label }): EntityRef => ({
          id,
          entityType,
          projectName,
          name,
          label,
        }),
      )
      Promise.resolve()
        .then(() => fetchValues({ projectName, page, entities: entityRefs, signal }))
        .then((values) => settle((id) => ({ status: 'loaded', value: values?.[id] })))
        .catch((error: unknown) => {
          if (signal.aborted) return
          const err = error instanceof Error ? error : new Error(String(error))
          reportContributionError(contribution as never, err)
          settle(() => ({ status: 'error', error: err }))
        })
    }
  }, [fetchValues, columnId, contribution, projectName, page])

  const ask = useCallback(
    (wanted: VersionedEntity[]) => {
      const current = state.current
      wanted.forEach((entity) => current.pending.set(entity.id, entity))
      if (!current.pending.size) return
      if (current.pending.size >= BATCH_SIZE) flush()
      else {
        clearTimeout(current.timer)
        current.timer = setTimeout(flush, BATCH_DELAY)
      }
    },
    [flush],
  )

  useEffect(() => {
    if (!fetchValues) return
    const current = state.current
    const before = new Set(current.onScreen.map((entity) => entity.id))
    current.onScreen = entities
    ask(
      entities.filter(({ id, version }) => {
        const entry = getAddonColumnEntry(columnId, id)
        if (!entry) return true
        // a failed row is tried again when it comes back on screen
        if (entry.status === 'error') return entry.version !== version || !before.has(id)
        return entry.version !== version
      }),
    )
  }, [entities, fetchValues, columnId, ask])

  // everything is out of date, the rows on screen ask now
  const refresh = useCallback(() => {
    state.current.controller.abort()
    state.current.controller = new AbortController()
    markAddonColumnStale(columnId)
    ask(state.current.onScreen)
  }, [columnId, ask])

  // refreshTableColumn(id) from the addon
  useEffect(
    () =>
      onTableColumnRefresh((id) => {
        if (id === contribution.id) refresh()
      }),
    [contribution.id, refresh],
  )

  // one of the column's providesTags was invalidated: the query ran again
  const tags = contribution.providesTags
  const { data: tagsRun } = useAddonColumnTagsQuery(
    { columnId, tags: tags || [] },
    { skip: !fetchValues || !tags?.length },
  )
  const lastTagsRun = useRef(tagsRun)
  useEffect(() => {
    const previous = lastTagsRun.current
    lastTagsRun.current = tagsRun
    if (previous !== undefined && tagsRun !== undefined && tagsRun !== previous) refresh()
  }, [tagsRun, refresh])

  return null
}

/**
 * Gets the values of every shown addon column for the rows on screen (fetchValues), into the
 * store the cells read. Wraps the table body.
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
  const fetchColumns = columns.flatMap((column) => {
    const meta = column.columnDef.meta?.addonColumn
    return meta?.contribution.fetchValues ? [{ columnId: column.id, meta }] : []
  })

  // one array per set of rows (and their versions), not per render
  const entitiesKey = entities
    .map((entity) => `${entity.entityType}:${entity.id}:${entity.updatedAt || ''}`)
    .join(',')
  const entityRefs = useMemo<VersionedEntity[]>(
    () =>
      entities.map((entity) => ({
        id: entity.id,
        entityType: entity.entityType,
        projectName,
        name: entity.name,
        label: entity.label || undefined,
        version: entity.updatedAt || '',
      })),
    // entities is compared by content
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entitiesKey, projectName],
  )

  return (
    <>
      {fetchColumns.map(({ columnId, meta }) => (
        <ColumnValuesFetcher key={columnId} meta={meta} columnId={columnId} entities={entityRefs} />
      ))}
      {children}
    </>
  )
}
