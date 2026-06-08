import { FC, useCallback, useMemo, useState } from 'react'
import {
  useGetProjectsData,
  isEmptyFolderPlaceholderRow,
  useProjectColumnConfig,
  useProjectColumns,
  useProjectSorting,
  useUpdateProjectTableRow,
  useProjectFilters,
  useProjectGrouping,
  useProjectTableRows,
} from './hooks'
import type { ProjectTableRow } from './hooks'
import ProjectsSearchFilterWrapper from './components/ProjectsSearchFilterWrapper'
import {
  getDefaultListTableDataTypeWidgets,
  ListTable,
  type ListTableRowDoubleClickHandler,
  type ListTableRowContextMenuBuilder,
} from '@shared/containers/ListTable'
import * as Styled from './ProjectsPage.styled'
import {
  Button,
  Dialog,
  SortCardType,
  SortingDropdown,
  Toolbar,
} from '@ynput/ayon-react-components'
import { PROJECTS_PER_PAGE } from '@shared/api'
import { ProjectDetailsPanel } from './components/ProjectDetailsPanel/ProjectDetailsPanel'
import { ProjectsPageTableSettings } from './components/ProjectsPageTableSettings'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import useShortcuts from '@hooks/useShortcuts'
import { SettingsPanelProvider, usePowerpack, useSettingsPanel } from '@shared/context'
import { CustomizeButton, PowerpackButton } from '@shared/components'
import { DEFAULT_COLUMNS_PROJECT, GROUP_BY_FOLDER_KEY } from './constants'
import useProjectMenuController from '@containers/ProjectsList/hooks/useProjectMenuController'
import { ProjectFolderFormDialog } from '@pages/ProjectManagerPage/components/ProjectFolderFormDialog'
import { getMaxDepth } from './utils'

interface ProjectsPageProps {
  onNewProject: () => void
}

export const DEFAULT_COLUMN_VISIBILITY = DEFAULT_COLUMNS_PROJECT

const ProjectsPageContent: FC<ProjectsPageProps> = ({ onNewProject }) => {
  const { powerLicense } = usePowerpack()
  // SETTINGS: grouping
  const { grouping, groupSortByDesc, handleGroupingChange, groupOptions } = useProjectGrouping()

  // Load folder metadata whenever folder grouping is active, even at nested levels.
  const groupBy = grouping.includes(GROUP_BY_FOLDER_KEY) ? GROUP_BY_FOLDER_KEY : grouping[0]

  // Get all projects data
  const {
    projects,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    projectsMap,
    foldersMap,
    projectFolders,
  } = useGetProjectsData({ showArchived: false, groupBy, groupByDesc: undefined })

  // GROUPING: compute max row depth for thumbnail column sizing
  // At max depth, the thumbnail column must be wide enough: 8 (indent base) + depth * 16 + 8 (inner pad) + 42 (thumb) + 8 (right pad)
  const maxGroupDepth = useMemo(() => getMaxDepth(foldersMap, grouping), [grouping, foldersMap])

  // TABLE: build table columns
  const { columns, columnAttributeData } = useProjectColumns(foldersMap, maxGroupDepth + 1)

  // GROUPING: convert grouping state to the format used by the UI component
  const groupValue = useMemo<SortCardType[]>(
    () =>
      grouping
        .map((id) => {
          const option = groupOptions.find((o) => o.id === id)
          if (!option) return null
          return { ...option, sortOrder: !groupSortByDesc }
        })
        .filter(Boolean) as SortCardType[],
    [groupOptions, groupSortByDesc, grouping],
  )

  // SETTINGS: column order, visibility, sizing
  const {
    columnOrder,
    columnVisibility,
    columnSizing,
    handleColumnOrderChange,
    handleColumnVisibilityChange,
    handleColumnSizingChange,
    handleColumnsConfigChange,
  } = useProjectColumnConfig({ columns })
  // SETTINGS: sorting
  const { sorting, handleSortingChange } = useProjectSorting()
  // SETTINGS: Filters
  const { filters, handleFiltersChange } = useProjectFilters()

  const handleGroupChange = (v: SortCardType[]) => {
    const nextGrouping = v.map((item) => item.id)
    const nextGroupSortByDesc = v[0]?.sortOrder === undefined ? groupSortByDesc : !v[0].sortOrder
    handleGroupingChange(nextGrouping, nextGroupSortByDesc)
  }

  const dataTypeWidgets = getDefaultListTableDataTypeWidgets<ProjectTableRow>()

  // TABLE: Build table rows and apply filters and grouping
  const displayRows = useProjectTableRows({
    projects,
    grouping,
    groupSortByDesc,
    foldersMap,
    columnAttributeData,
    filters,
  })

  // SELECTION
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const selectedProjectName =
    selectedProjectIds[0] && projectsMap.has(selectedProjectIds[0])
      ? selectedProjectIds[0]
      : undefined
  const clearSelection = () => setSelectedProjectIds([])

  const handleProjectUpdate = useUpdateProjectTableRow()
  const { isPanelOpen } = useSettingsPanel()

  // CONTEXT: build context menu for project and folder rows
  const {
    canCreateProject,
    buildListTableContextMenuItems,
    folderDialogProps,
    onOpenProject,
    handleOpenFolderDialog,
  } = useProjectMenuController({
    // @ts-expect-error - just dif between label null and undefined
    projects,
    folders: projectFolders,
    selection: selectedProjectIds,
    onSelect: setSelectedProjectIds,
    onNewProject,
    hidden: {
      search: true,
      'select-all': true,
      'pin-project': true,
      'show-archived': true,
      'rename-folder': true,
      'edit-label': true,
    },
  })

  const rowContextMenuBuilders = useMemo<ListTableRowContextMenuBuilder<ProjectTableRow>[]>(
    () => [
      (_event, context) => {
        if (isEmptyFolderPlaceholderRow(context.row.original)) {
          return []
        }

        return buildListTableContextMenuItems(context)
      },
    ],
    [buildListTableContextMenuItems],
  )

  const handleRowDoubleClick = useCallback<ListTableRowDoubleClickHandler<ProjectTableRow>>(
    (_event, context) => {
      if (isEmptyFolderPlaceholderRow(context.row.original)) {
        return
      }

      onOpenProject(context.row.original.name)
    },
    [onOpenProject],
  )

  useShortcuts(
    useMemo(
      () => [
        {
          key: 'Escape',
          action: clearSelection,
        },
      ],
      [],
    ),
  )

  return (
    <Styled.PageContainer style={{ flexDirection: 'column', gap: 8 }}>
      <Toolbar>
        {canCreateProject && (
          <Button icon="add" variant="filled" onClick={() => onNewProject()}>
            Create new project
          </Button>
        )}
        {powerLicense ? (
          <Button icon="create_new_folder" onClick={() => handleOpenFolderDialog()}>
            Create folder
          </Button>
        ) : (
          <PowerpackButton
            rounded={false}
            feature="projectFolders"
            variant="surface"
            icon="create_new_folder"
            bolt
          >
            Create folder
          </PowerpackButton>
        )}
        <ProjectsSearchFilterWrapper queryFilters={filters} onChange={handleFiltersChange} />
        <SortingDropdown
          title="Group by"
          value={groupValue}
          options={groupOptions}
          onChange={handleGroupChange}
          multiSelect
          style={{ minWidth: 'fit-content' }}
        />
        <CustomizeButton />
      </Toolbar>
      <Splitter
        layout="horizontal"
        stateKey="projects-splitter-settings"
        stateStorage="local"
        style={{ flex: 1, overflow: 'hidden' }}
        gutterSize={isPanelOpen ? 4 : 0}
      >
        <SplitterPanel size={82} style={{ overflow: 'hidden' }}>
          <DetailsPanelSplitter style={{ overflow: 'hidden', height: '100%', width: '100%' }}>
            <SplitterPanel size={70} style={{ overflow: 'hidden' }}>
              <ListTable<ProjectTableRow>
                data={displayRows}
                columns={columns}
                getRowId={(row) => row.id}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                rowContextMenuBuilders={rowContextMenuBuilders}
                onRowDoubleClick={handleRowDoubleClick}
                selectedRows={selectedProjectIds}
                onSelectedRowsChange={setSelectedProjectIds}
                onUpdateRow={handleProjectUpdate}
                columnAttributeData={columnAttributeData}
                dataTypeWidgets={dataTypeWidgets}
                enableColumnReordering
                enableSorting
                sorting={sorting}
                onSortingChange={handleSortingChange}
                columnOrder={columnOrder}
                onColumnOrderChange={handleColumnOrderChange}
                enableColumnVisibility
                columnVisibility={columnVisibility}
                defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
                onColumnVisibilityChange={handleColumnVisibilityChange}
                enableColumnResizing
                columnSizing={columnSizing}
                onColumnSizingChange={handleColumnSizingChange}
                editable={false}
                getIsRowInactive={(row) => row.active === false}
              />
            </SplitterPanel>
            <SplitterPanel size={30} className="details">
              {selectedProjectName && (
                <ProjectDetailsPanel
                  projectName={selectedProjectName}
                  data={projectsMap.get(selectedProjectName)}
                  onClose={clearSelection}
                />
              )}
            </SplitterPanel>
          </DetailsPanelSplitter>
        </SplitterPanel>
        {isPanelOpen ? (
          <SplitterPanel size={18} style={{ zIndex: 500 }}>
            <ProjectsPageTableSettings
              columns={columns}
              columnOrder={columnOrder ?? []}
              columnVisibility={columnVisibility}
              defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
              columnSizing={columnSizing}
              sorting={sorting}
              grouping={grouping}
              groupSortByDesc={groupSortByDesc}
              groupOptions={groupOptions}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnsConfigChange={handleColumnsConfigChange}
              onSortingChange={handleSortingChange}
              onGroupingChange={handleGroupingChange}
            />
          </SplitterPanel>
        ) : (
          <SplitterPanel style={{ maxWidth: 0 }} />
        )}
      </Splitter>
      {hasNextPage && (
        <Dialog
          size="sm"
          isOpen={true}
          onClose={() => {}}
          hideCancelButton
          showCloseButton={false}
          header={`Congratulations you have more than ${projects.length} projects.`}
        >
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Loading...' : `Click here to load ${PROJECTS_PER_PAGE} more`}
          </Button>
        </Dialog>
      )}
      <ProjectFolderFormDialog {...folderDialogProps} />
    </Styled.PageContainer>
  )
}

export const ProjectsPage: FC<ProjectsPageProps> = (props) => {
  return (
    <SettingsPanelProvider>
      <ProjectsPageContent {...props} />
    </SettingsPanelProvider>
  )
}
