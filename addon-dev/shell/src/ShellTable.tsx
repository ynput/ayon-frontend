// AYON's project table (ProjectTreeTable from the shared package) with the entities picked in
// Context as its rows: Name and Status, then the addon's columns. Its header cells, column menus
// (with the projectTable.columnMenuItem items), cell widgets, resizing, selection, right-click
// menu (entityMenuItem) and shortcuts (table.shortcut) are AYON's own. The shell feeds the table's
// providers from local state instead of a page: the rows from the Context form, the column
// settings kept in memory, no edits saved.
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ColumnDef, ExpandedState } from '@tanstack/react-table'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { EntityRef, ProjectTablePage, ProjectTableState } from '@ynput/ayon-addon'
import { useGetEntitiesDetailsPanelQuery } from '@ynput/ayon-frontend-shared/api'
import { usePowerpack } from '@ynput/ayon-frontend-shared/context'
import {
  CellEditingProvider,
  ColumnDndProvider,
  ColumnSettingsProvider,
  DetailsPanelEntityProvider,
  ENTITY_COLUMN_IDS,
  LISTS_COLUMN_ID,
  ProjectDataContext,
  ProjectTableProvider,
  ProjectTableQueriesProvider,
  ProjectTableStateContext,
  ProjectTreeTable,
  REVIEW_SESSIONS_COLUMN_ID,
  ROW_SELECTION_COLUMN_ID,
  SelectedRowsProvider,
  SelectionCellsProvider,
  parseCellId,
  useAddonEntityMenuItems,
  useAddonTableColumns,
  useOptionalProjectDataContext,
  useSelectionCellsContext,
} from '@ynput/ayon-frontend-shared/ProjectTreeTable'
import type {
  ContextMenuItemConstructors,
  EntitiesMap,
  ProjectDataContextProps,
  ProjectTableProviderProps,
  TableRow,
  TreeTableExtraColumn,
} from '@ynput/ayon-frontend-shared/ProjectTreeTable'
import { Placeholder, usePlaceholderShown } from './slotOverlay'

interface ShellTableProps {
  page: ProjectTablePage
  /** what the table shows, for the addon menu items */
  tableState?: ProjectTableState
  entities: EntityRef[]
  /** the rows of the selected cells */
  onSelect: (selected: EntityRef[]) => void
}

// AYON's columns other than Name and Status
const EXCLUDED_COLUMNS = [
  ROW_SELECTION_COLUMN_ID,
  'thumbnail',
  'entityType',
  ENTITY_COLUMN_IDS.folder,
  'subType',
  'assignees',
  'tags',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  'comments',
  LISTS_COLUMN_ID,
  REVIEW_SESSIONS_COLUMN_ID,
]

const noop = () => undefined
const noData = async () => undefined
const NO_ROW_DATA: ProjectDataContextProps = {
  isInitialized: true,
  isLoading: false,
  users: [],
  attribFields: [],
  writableFields: [],
  canWriteNamePermission: false,
  canWriteLabelPermission: false,
}
// the group-by settings are the Customize panel's, which the shell draws itself
const MODULES = { GroupSettings: (() => null) as never, isLoading: false }

/** The "+ Column" placeholder of an unused tableColumn slot, as a column at the end. */
const PLACEHOLDER_COLUMN: TreeTableExtraColumn = {
  column: {
    id: 'ayon-dev-column-placeholder',
    header: () => <Placeholder slot="tableColumn" label="Column" />,
    cell: () => null,
    size: 120,
    enableSorting: false,
    enableHiding: false,
    enablePinning: false,
    enableResizing: false,
  } as ColumnDef<TableRow>,
}

interface Details {
  id: string
  name?: string
  label?: string | null
  status?: string
  entitySubType?: string
  path?: string
}

/** The selected cells' rows, as the shell's selection. */
const SelectionSync = ({
  entities,
  onSelect,
}: {
  entities: EntityRef[]
  onSelect: (selected: EntityRef[]) => void
}) => {
  const { selectedCells } = useSelectionCellsContext()
  useEffect(() => {
    const ids = new Set([...selectedCells].map((cellId) => parseCellId(cellId)?.rowId))
    onSelect(entities.filter((entity) => ids.has(entity.id)))
    // only when the selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCells])
  return null
}

/** The project's attributes and users, or none in preview (no server to read them from). */
const ProjectData = ({ children }: { children: ReactNode }) =>
  useOptionalProjectDataContext() ? (
    <>{children}</>
  ) : (
    <ProjectDataContext.Provider value={NO_ROW_DATA}>{children}</ProjectDataContext.Provider>
  )

export const ShellTable = ({ page, tableState, entities, onSelect }: ShellTableProps) => {
  const { columns: addonColumns } = useAddonTableColumns(page)
  const placeholder = usePlaceholderShown('tableColumn')
  const extraColumns = useMemo(
    () => (placeholder ? [...addonColumns, PLACEHOLDER_COLUMN] : addonColumns),
    [addonColumns, placeholder],
  )
  // shown: Name, Status and those columns (the others start hidden, as AYON's opt-in columns)
  const defaultColumnVisibility = useMemo(
    () =>
      Object.fromEntries(
        ['name', 'status', ...extraColumns.map((extra) => extra.column.id || '')].map((id) => [
          id,
          true,
        ]),
      ),
    [extraColumns],
  )

  // the rows: the entities picked in Context, with their names and statuses from the server
  const entityType = entities[0]?.entityType || 'task'
  const { data: details = [] } = useGetEntitiesDetailsPanelQuery(
    {
      entityType: entityType as never,
      entities: entities.map((e) => ({ id: e.id, projectName: e.projectName })),
    },
    { skip: !entities.length },
  )
  // the rows' types: the name column's label
  const scopes = useMemo(
    () => [...new Set(entities.map((entity) => entity.entityType))],
    [entities],
  )
  const { rows, entitiesMap } = useMemo(() => {
    const map: EntitiesMap = new Map()
    const tableRows = entities.map((entity): TableRow => {
      const found = (details as Details[]).find((d) => d.id === entity.id)
      const primary = {
        id: entity.id,
        entityId: entity.id,
        entityType: entity.entityType,
        name: found?.name || entity.name || entity.id,
        label: found?.label || entity.label,
        status: found?.status,
        subType: found?.entitySubType || '',
        path: found?.path,
      }
      map.set(entity.id, primary as never)
      return { id: entity.id, primary: primary as TableRow['primary'], readOnly: true }
    })
    return { rows: tableRows, entitiesMap: map }
  }, [entities, details])

  // the column settings, kept for the session (AYON saves them in the page's view)
  const [columns, setColumns] = useState<Record<string, unknown>>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const queryFilters = useMemo(() => ({ filter: undefined, search: undefined }), [])

  // the right-click menu: the addon's items (entityMenuItem) around AYON's copy and paste
  const addonTopItems = useAddonEntityMenuItems(page, 'top', tableState)
  const addonItems = useAddonEntityMenuItems(page, 'bottom', tableState)
  const contextMenuItems = useMemo<ContextMenuItemConstructors>(
    () => [addonTopItems, 'copy-paste', addonItems],
    [addonTopItems, addonItems],
  )
  const powerpack = usePowerpack()

  const tableProps: Omit<ProjectTableProviderProps, 'children'> = {
    isInitialized: true,
    isLoading: false,
    isLoadingMore: false,
    users: [],
    attribFields: [],
    scopes,
    tasksMap: new Map(),
    foldersMap: new Map(),
    entitiesMap,
    tasksByFolderMap: new Map(),
    tableRows: rows,
    groups: [],
    fetchNextPage: noop,
    onSyncData: noop as never,
    queryFilters,
    showHierarchy: false,
    updateShowHierarchy: noop,
    expanded,
    setExpanded,
    toggleExpanded: noop,
    updateExpanded: setExpanded as never,
    contextMenuItems,
    powerpack,
    modules: MODULES,
    readOnly: true,
    useParams,
    useNavigate,
    useLocation,
    useSearchParams,
  }

  return (
    <div className="ayon-shell-tree-table" data-shell-surface="table">
      <ProjectTableStateContext.Provider value={tableState}>
        <ProjectData>
          <DetailsPanelEntityProvider>
            <ColumnSettingsProvider
              config={columns}
              onChange={(next) => setColumns(next as Record<string, unknown>)}
              defaultColumnVisibility={defaultColumnVisibility}
            >
              <ColumnDndProvider>
                <ProjectTableQueriesProvider updateEntities={noData} getFoldersTasks={noData}>
                  <ProjectTableProvider {...tableProps}>
                    <SelectionCellsProvider>
                      <SelectedRowsProvider>
                        <CellEditingProvider>
                          <ProjectTreeTable
                            addonPage={page}
                            scope={`addon-dev-${page}`}
                            sliceId=""
                            clientSorting
                            excludedColumns={EXCLUDED_COLUMNS}
                            extraColumns={extraColumns}
                          />
                          <SelectionSync entities={entities} onSelect={onSelect} />
                        </CellEditingProvider>
                      </SelectedRowsProvider>
                    </SelectionCellsProvider>
                  </ProjectTableProvider>
                </ProjectTableQueriesProvider>
              </ColumnDndProvider>
            </ColumnSettingsProvider>
          </DetailsPanelEntityProvider>
        </ProjectData>
      </ProjectTableStateContext.Provider>
    </div>
  )
}
