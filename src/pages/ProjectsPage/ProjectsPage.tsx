import { FC, useCallback, useMemo, useState } from 'react'
import {
  useGetProjectsData,
  useProjectColumnConfig,
  useProjectColumns,
  useProjectSorting,
  useUpdateProjectTableRow,
  useProjectFilters,
  useProjectGrouping,
  applyProjectFilters,
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
import type { ListTableGroupingPathItem } from '@shared/containers/ListTable/ListTable.types'

interface ProjectsPageProps {
  onNewProject: () => void
}

const ProjectsPageContent: FC<ProjectsPageProps> = ({ onNewProject }) => {
  const { grouping, groupSortByDesc, handleGroupingChange } = useProjectGrouping()

  // Load folder metadata whenever folder grouping is active, even at nested levels.
  const groupBy = grouping.includes(GROUP_BY_FOLDER_KEY) ? GROUP_BY_FOLDER_KEY : grouping[0]
  const { tableRows, fetchNextPage, hasNextPage, isFetchingNextPage, projectsMap, foldersMap } =
    useGetProjectsData({
      showArchived: false,
      groupBy,
      groupByDesc: undefined,
    })

  const { columns, columnAttributeData, groupOptions } = useProjectColumns(tableRows, foldersMap)
  const {
    columnOrder,
    columnVisibility,
    columnSizing,
    handleColumnOrderChange,
    handleColumnVisibilityChange,
    handleColumnSizingChange,
    handleColumnsConfigChange,
  } = useProjectColumnConfig({ columns })
  const { sorting, handleSortingChange } = useProjectSorting()
  const { filters, handleFiltersChange } = useProjectFilters()
  const dataTypeWidgets = getDefaultListTableDataTypeWidgets<ProjectTableRow>()

  const filteredRows = useMemo(() => applyProjectFilters(tableRows, filters), [tableRows, filters])

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const selectedProjectName = selectedProjectIds[0]
  const clearSelection = () => setSelectedProjectIds([])

  const handleProjectUpdate = useUpdateProjectTableRow(tableRows)
  const { isPanelOpen } = useSettingsPanel()

  const getGroupingPath = useCallback(
    (columnId: string, row: ProjectTableRow): ListTableGroupingPathItem[] | undefined => {
      if (columnId !== GROUP_BY_FOLDER_KEY) return undefined
      if (!row.projectFolder) {
        return [{ value: null, label: 'No folder', sortValue: 'No folder' }]
      }

      const path: ListTableGroupingPathItem[] = []
      let currentFolder = foldersMap.get(row.projectFolder)

      while (currentFolder) {
        path.unshift({
          value: currentFolder.id,
          label: currentFolder.label,
          icon: currentFolder.data?.icon ?? undefined,
          color: currentFolder.data?.color ?? undefined,
          sortValue: currentFolder.label,
        })

        currentFolder = currentFolder.parentId ? foldersMap.get(currentFolder.parentId) : undefined
      }

      return path.length ? path : [{ value: null, label: 'No folder', sortValue: 'No folder' }]
    },
    [foldersMap],
  )

  const getGroupDisplay = useCallback(
    (columnId: string, value: unknown) => {
      if (columnId === GROUP_BY_FOLDER_KEY) {
        if (value === null || value === undefined) return { label: 'No folder' }
        const folder = foldersMap.get(String(value))
        return {
          label: folder?.label ?? String(value),
          icon: folder?.data?.icon,
          color: folder?.data?.color,
        }
      }

      const attribute = columnAttributeData[columnId]
      if (!attribute) return undefined

      if (attribute.enum?.length) {
        const option = attribute.enum.find((item) => String(item.value) === String(value))
        return option
          ? {
              label: String(option.label ?? option.value),
              icon: typeof option.icon === 'string' ? option.icon : undefined,
              color: option.color,
            }
          : { label: String(value) }
      }

      if (attribute.type === 'boolean') {
        if (value === null || value === undefined) return { label: '(None)' }
        return { label: String(value) === 'true' ? 'True' : 'False' }
      }

      return undefined
    },
    [columnAttributeData, foldersMap],
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
                data={filteredRows}
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
                grouping={grouping}
                onGroupingChange={handleGroupingChange}
                groupSortByDesc={groupSortByDesc}
                getGroupingPath={getGroupingPath}
                getGroupDisplay={getGroupDisplay}
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
          header={`Congratulations you have more than ${tableRows.length} projects.`}
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
