import { FC, useMemo, useState } from 'react'
import {
  useGetProjectsData,
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
import { getDefaultListTableDataTypeWidgets, ListTable } from '@shared/containers/ListTable'
import * as Styled from './ProjectsPage.styled'
import { Button, Dialog, Toolbar } from '@ynput/ayon-react-components'
import { PROJECTS_PER_PAGE } from '@shared/api'
import { ProjectDetailsPanel } from './components/ProjectDetailsPanel/ProjectDetailsPanel'
import { ProjectsPageTableSettings } from './components/ProjectsPageTableSettings'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import useShortcuts from '@hooks/useShortcuts'
import { WithViews } from '@/hoc/WithViews'
import { SettingsPanelProvider, useSettingsPanel } from '@shared/context'
import { CustomizeButton } from '@shared/components'
import { GROUP_BY_FOLDER_KEY } from './constants'

interface ProjectsPageProps {
  onNewProject: () => void
}

const ProjectsPageContent: FC<ProjectsPageProps> = ({ onNewProject }) => {
  const { grouping, groupSortByDesc, handleGroupingChange } = useProjectGrouping()

  // Load folder metadata whenever folder grouping is active, even at nested levels.
  const groupBy = grouping.includes(GROUP_BY_FOLDER_KEY) ? GROUP_BY_FOLDER_KEY : grouping[0]

  // Get all projects data
  const { projects, fetchNextPage, hasNextPage, isFetchingNextPage, projectsMap, foldersMap } =
    useGetProjectsData({ showArchived: false, groupBy, groupByDesc: undefined })

  // TABLE: build table columns
  const { columns, columnAttributeData, groupOptions } = useProjectColumns(foldersMap)

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
  const dataTypeWidgets = getDefaultListTableDataTypeWidgets<ProjectTableRow>()

  // TABLE: apply filters and grouping
  const displayRows = useProjectTableRows({
    projects,
    grouping,
    groupSortByDesc,
    foldersMap,
    columnAttributeData,
    filters,
  })

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const selectedProjectName = selectedProjectIds[0]
  const clearSelection = () => setSelectedProjectIds([])

  const handleProjectUpdate = useUpdateProjectTableRow()
  const { isPanelOpen } = useSettingsPanel()

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
        <Button icon="add" variant="filled" onClick={() => onNewProject()}>
          Create new project
        </Button>
        <ProjectsSearchFilterWrapper queryFilters={filters} onChange={handleFiltersChange} />
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
                onColumnVisibilityChange={handleColumnVisibilityChange}
                enableColumnResizing
                columnSizing={columnSizing}
                onColumnSizingChange={handleColumnSizingChange}
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
    </Styled.PageContainer>
  )
}

export const ProjectsPage: FC<ProjectsPageProps> = (props) => {
  return (
    <WithViews viewType="projects-overview">
      <SettingsPanelProvider>
        <ProjectsPageContent {...props} />
      </SettingsPanelProvider>
    </WithViews>
  )
}
