import { FC, useCallback, useMemo, useState } from 'react'
import { useGetProjectsData, useProjectColumns, useUpdateProjectTableRow } from './hooks'
import type { ProjectTableRow } from './hooks'
import { getDefaultListTableDataTypeWidgets, ListTable } from '@shared/containers/ListTable'
import * as Styled from './ProjectsPage.styled'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { PROJECTS_PER_PAGE } from '@shared/api'
import { ProjectDetailsPanel } from './components/ProjectDetailsPanel/ProjectDetailsPanel'
import { SplitterPanel } from 'primereact/splitter'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import useShortcuts from '@hooks/useShortcuts'
import { WithViews } from '@/hoc/WithViews'
import { useViewsContext } from '@shared/containers'
import { useViewUpdateHelper } from '@shared/containers/Views/utils/viewUpdateHelper'
import {
  convertColumnConfigToTanstackStates,
  convertTanstackStatesToColumnConfig,
} from '@shared/util'
import type { OverviewSettings } from '@shared/api/generated/views'
import { ColumnOrderState } from '@tanstack/react-table'

interface ProjectsPageProps {}

const ProjectsPageContent: FC = () => {
  const { tableRows, fetchNextPage, hasNextPage, isFetchingNextPage, projectsMap } =
    useGetProjectsData({
      showArchived: false,
      groupBy: undefined,
      groupByDesc: undefined,
    })

  const { columns, columnAttributeData } = useProjectColumns(tableRows)
  const dataTypeWidgets = getDefaultListTableDataTypeWidgets<ProjectTableRow>()

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const selectedProjectName = selectedProjectIds[0]
  const clearSelection = () => setSelectedProjectIds([])

  const handleProjectUpdate = useUpdateProjectTableRow(tableRows)

  // --- Column order (views persistence) ---
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const [localColumnOrder, setLocalColumnOrder] = useState<ColumnOrderState | null>(null)

  const storedColumnOrder = useMemo<ColumnOrderState | undefined>(() => {
    const settings = viewSettings as OverviewSettings | undefined
    if (!settings?.columns?.length) return undefined
    const config = convertColumnConfigToTanstackStates(settings)
    return config.columnOrder.length > 0 ? config.columnOrder : undefined
  }, [viewSettings])

  const columnOrder = localColumnOrder ?? storedColumnOrder

  const handleColumnOrderChange = useCallback(
    async (newOrder: ColumnOrderState) => {
      const allColumnIds = columns.map((c) => c.id as string)
      const columnConfig = convertTanstackStatesToColumnConfig(
        {
          columnOrder: newOrder,
          columnVisibility: {},
          columnPinning: {},
          columnSizing: {},
        },
        allColumnIds,
      )
      await updateViewSettings({ columns: columnConfig.columns }, setLocalColumnOrder, newOrder, {})
    },
    [columns, updateViewSettings],
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
    <Styled.PageContainer>
      <DetailsPanelSplitter style={{ overflow: 'hidden' }}>
        <SplitterPanel size={70} style={{ overflow: 'hidden' }}>
          <ListTable<ProjectTableRow>
            data={tableRows}
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
            columnOrder={columnOrder}
            onColumnOrderChange={handleColumnOrderChange}
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

export const ProjectsPage: FC<ProjectsPageProps> = () => {
  return (
    <WithViews viewType="projects-overview">
      <ProjectsPageContent />
    </WithViews>
  )
}
