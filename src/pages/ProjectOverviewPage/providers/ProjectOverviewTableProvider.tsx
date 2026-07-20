import { FC, useMemo } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  ProjectTableProvider,
  SelectionCellsProvider,
  SelectedRowsProvider,
  CellEditingProvider,
  DetailsPanelEntityProvider,
  useColumnSettingsContext,
  useGroupCounts,
} from '@shared/containers/ProjectTreeTable'
import { NewEntityProvider } from '@shared/containers/NewEntity'
import { usePowerpack, useSubtasksModulesContext } from '@shared/context'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'
import { ProjectTableQueriesProvider } from '@shared/containers/ProjectTreeTable/context/ProjectTableQueriesContext'
import useTableQueriesHelper from '../hooks/useTableQueriesHelper'
import ProjectOverviewPage from '../ProjectOverviewPage'
import useTableOpenViewer from '../hooks/useTableOpenViewer'
import { useAppSelector } from '@state/store'
import { useViewsContext } from '@shared/containers'
import { ProjectTableModulesType } from '@shared/hooks'

const SCOPES = ['folder', 'task']

const ProjectOverviewTableProvider: FC<{ modules: ProjectTableModulesType }> = ({ modules }) => {
  const { taskGroups, viewGroupBy, viewGroupByDesc, isFlatFolderView, ...props } =
    useProjectOverviewContext()

  // Convert view dropdown's groupBy string to TableGroupBy object for ProjectTableProvider
  // For flat folder view, we don't set a groupBy — it uses hierarchy-style task fetching
  const overrideGroupBy = useMemo(
    () =>
      viewGroupBy && viewGroupBy !== 'none' && !isFlatFolderView
        ? { id: viewGroupBy, desc: viewGroupByDesc }
        : undefined,
    [viewGroupBy, isFlatFolderView, viewGroupByDesc],
  )

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: props.projectName,
  })

  const { resetWorkingView, isLoadingViews } = useViewsContext()

  // filter-aware per-group counts for the active grouping (community: not license-gated)
  const { groupBy: columnSettingsGroupBy } = useColumnSettingsContext()
  const groupByForCounts = useMemo(
    () => (isFlatFolderView ? undefined : overrideGroupBy || columnSettingsGroupBy),
    [isFlatFolderView, overrideGroupBy, columnSettingsGroupBy],
  )

  const statsTaskIds = props.selectedTaskIds?.length ? props.selectedTaskIds : undefined
  const statsFolderIds = useMemo(
    () =>
      !statsTaskIds && props.selectedFolders?.length
        ? Array.from(props.foldersMap.keys())
        : undefined,
    [statsTaskIds, props.selectedFolders, props.foldersMap],
  )
  const taskStatsFolderIds = useMemo(
    () =>
      statsFolderIds
        ? Array.from(new Set([...statsFolderIds, ...props.selectedFolders]))
        : undefined,
    [statsFolderIds, props.selectedFolders],
  )

  const { counts: groupCounts, complete: groupCountsComplete } = useGroupCounts({
    entity: 'task',
    groupBy: groupByForCounts,
    skip: isLoadingViews,
    args: {
      projectName: props.projectName,
      filter: props.taskFilters?.filterString || undefined,
      folderFilter: props.folderFilters?.filterString || undefined,
      search: props.taskFilters?.search || undefined,
      folderIds: taskStatsFolderIds,
      taskIds: statsTaskIds,
    },
  })

  const powerpack = usePowerpack()
  const { SubtasksManager } = useSubtasksModulesContext()

  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)
  const handleOpenPlayer = useTableOpenViewer({ projectName: props.projectName })

  return (
    <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
      {/* @ts-ignore */}
      <ProjectTableProvider
        {...props}
        groups={isFlatFolderView ? [] : taskGroups}
        groupCounts={groupCounts}
        groupCountsComplete={groupCountsComplete}
        overrideGroupBy={overrideGroupBy}
        isFlatFolderView={isFlatFolderView}
        powerpack={powerpack}
        modules={modules}
        groupByConfig={{ entityType: 'task' }}
        scopes={SCOPES}
        playerOpen={viewerOpen}
        onOpenPlayer={handleOpenPlayer}
        onResetView={resetWorkingView}
        SubtasksManager={SubtasksManager}
        useParams={useParams}
        useNavigate={useNavigate}
        useLocation={useLocation}
        useSearchParams={useSearchParams}
      >
        <NewEntityProvider>
          <DetailsPanelEntityProvider>
            <SelectionCellsProvider>
              <SelectedRowsProvider>
                <CellEditingProvider>
                  <ProjectOverviewPage />
                </CellEditingProvider>
              </SelectedRowsProvider>
            </SelectionCellsProvider>
          </DetailsPanelEntityProvider>
        </NewEntityProvider>
      </ProjectTableProvider>
    </ProjectTableQueriesProvider>
  )
}

export default ProjectOverviewTableProvider
