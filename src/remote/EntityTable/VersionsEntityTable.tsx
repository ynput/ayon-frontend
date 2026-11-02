// EntityTable for versions: the versions table of Products (VersionsDataProvider and
// VPProjectTableProvider, the page's own data layer and queries), with the rows from the addon's
// filter and ids instead of the page's view and slicer.
import { useMemo, type ComponentProps } from 'react'
import type { EntityTableProps } from '@ynput/ayon-addon'
import type { QueryFilter } from '@shared/api'
import {
  CellEditingProvider,
  ColumnDndProvider,
  ColumnSettingsProvider,
  ProjectTableQueriesProvider,
  ProjectTreeTable,
  SelectedRowsProvider,
  SelectionCellsProvider,
  useColumnSettingsContext,
  useProjectDataContext,
} from '@shared/containers/ProjectTreeTable'
import { useGroupByRemoteModules } from '@shared/hooks'
import { DEFAULT_COLUMNS_VERSION } from '@pages/ProjectsPage/constants'
import useTableQueriesHelper from '@pages/ProjectOverviewPage/hooks/useTableQueriesHelper'
import {
  VersionsDataProvider,
  useVersionsDataContext,
  type VersionsDataSource,
} from '@pages/VersionsProductsPage/context/vp-data'
import { VPProjectTableProvider } from '@pages/VersionsProductsPage/providers/VPProjectTableProvider'
import {
  VP_EXCLUDED_COLUMNS,
  VP_INCLUDE_PARENTS,
} from '@pages/VersionsProductsPage/components/VPTable/VPTable'
import {
  VP_COLUMN_ID_ALIASES,
  VP_PARENT_COLUMNS,
} from '@pages/VersionsProductsPage/components/VPTableSettings/VPTableSettingsHelpers'
import {
  READ_ONLY_MENU_ITEMS,
  noUpdate,
  readOnlyColumns,
  useEntityTableColumns,
} from './entityTableHelpers'
import * as Styled from './EntityTable.styled'

const EMPTY_FILTER: QueryFilter = { conditions: [] }
const NO_IDS: string[] = []
const noop = () => {}
// as the Products table
const COLUMNS_CONFIG: ComponentProps<typeof ProjectTreeTable>['columnsConfig'] = {
  name: { display: { path_compact: false, path_full: true } },
}

export const VersionsEntityTable = ({ columns, onColumnsChange, ...props }: EntityTableProps) => {
  // the grouped versions query takes the version ids too, so versions group with ids as well
  const { config, onChange } = useEntityTableColumns(columns, onColumnsChange, false)

  return (
    <ColumnSettingsProvider
      config={config}
      onChange={onChange}
      defaultColumnVisibility={DEFAULT_COLUMNS_VERSION}
      columnIdAliases={VP_COLUMN_ID_ALIASES}
    >
      <ColumnDndProvider>
        <VersionsEntityTableData {...props} />
      </ColumnDndProvider>
    </ColumnSettingsProvider>
  )
}

const VersionsEntityTableData = ({
  projectName,
  filter,
  ids,
  excludedColumns,
  className,
}: Omit<EntityTableProps, 'columns' | 'onColumnsChange' | 'entityType'>) => {
  const modules = useGroupByRemoteModules()
  const { sorting, groupBy, columnVisibility } = useColumnSettingsContext()
  const { getFoldersTasks } = useTableQueriesHelper({ projectName })

  // the page's view and slicer, from the props: no products, no slicer
  const source: VersionsDataSource = useMemo(
    () => ({
      filters: (filter as QueryFilter | undefined) ?? EMPTY_FILTER,
      showProducts: false,
      onUpdateShowProducts: noop,
      sorting,
      featuredVersionOrder: NO_IDS,
      latestPerFolder: undefined,
      groupBy,
      columnVisibility,
      isLoadingViews: false,
      sliceFilters: [],
      folderIds: NO_IDS,
      versionIds: ids ?? NO_IDS,
      productIds: NO_IDS,
      taskIds: NO_IDS,
      isLoadingSlice: false,
    }),
    [filter, sorting, groupBy, columnVisibility, ids],
  )

  return (
    <VersionsDataProvider projectName={projectName} modules={modules} source={source}>
      <ProjectTableQueriesProvider updateEntities={noUpdate} getFoldersTasks={getFoldersTasks}>
        <VPProjectTableProvider projectName={projectName} modules={modules}>
          <SelectionCellsProvider>
            <SelectedRowsProvider>
              <CellEditingProvider>
                <VersionsEntityTableView
                  projectName={projectName}
                  excludedColumns={excludedColumns}
                  className={className}
                />
              </CellEditingProvider>
            </SelectedRowsProvider>
          </SelectionCellsProvider>
        </VPProjectTableProvider>
      </ProjectTableQueriesProvider>
    </VersionsDataProvider>
  )
}

type ViewProps = Pick<EntityTableProps, 'projectName' | 'excludedColumns' | 'className'>

// VPTable without the page's context menu, Add column button and addon columns
const VersionsEntityTableView = ({ projectName, excludedColumns, className }: ViewProps) => {
  const { attribFields } = useProjectDataContext()
  const {
    fetchNextPage,
    isLoading,
    fieldStats,
    groupFieldStats,
    fieldStatsLoading,
    fieldStatsError,
  } = useVersionsDataContext()
  const readOnly = useMemo(() => readOnlyColumns(attribFields), [attribFields])
  const excluded = useMemo(
    () => [...VP_EXCLUDED_COLUMNS, ...(excludedColumns ?? [])],
    [excludedColumns],
  )

  return (
    <Styled.TableWrapper className={className}>
      <ProjectTreeTable
        scope={`entity-table-version-${projectName}`}
        sliceId=""
        onScrollBottom={() => fetchNextPage()}
        onScrollBottomGroupBy={(groupValue: string) => fetchNextPage(groupValue)}
        readOnly={readOnly}
        excludedColumns={excluded}
        isExpandable={false}
        isLoading={isLoading}
        includeLinks={false}
        includeParents={VP_INCLUDE_PARENTS}
        parentColumns={VP_PARENT_COLUMNS}
        showColumnSummaries
        fieldStats={fieldStats}
        groupFieldStats={groupFieldStats}
        fieldStatsLoading={fieldStatsLoading}
        fieldStatsError={fieldStatsError}
        mainCountLabels={{ primary: 'products', secondary: 'versions' }}
        // versions have no subType, so only the products side breaks down
        mainBreakdownFields={{ primary: 'productType' }}
        columnsConfig={COLUMNS_CONFIG}
        contextMenuItems={READ_ONLY_MENU_ITEMS}
      />
    </Styled.TableWrapper>
  )
}
