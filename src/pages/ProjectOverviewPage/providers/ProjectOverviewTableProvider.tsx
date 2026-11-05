import { FC, ReactNode, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  ProjectTableProvider,
  ProjectTableQueriesProvider,
  SelectionCellsProvider,
  SelectedRowsProvider,
  CellEditingProvider,
  useColumnSettingsContext,
  useGroupCounts,
} from '@shared/containers/ProjectTreeTable'
import type {
  ContextMenuItemConstructor,
  ContextMenuItemConstructors,
} from '@shared/containers/ProjectTreeTable'
import { entityUrl } from '@ynput/ayon-addon'
import { usePowerpack, useSubtasksModulesContext } from '@shared/context'
import { useSlicerContext } from '@shared/containers'
import { useProjectOverviewContext } from '../context/project-overview'
import useTableQueriesHelper from '../hooks/useTableQueriesHelper'
import ProjectOverviewPage from '../ProjectOverviewPage'
import useTableOpenViewer from '../hooks/useTableOpenViewer'
import { useAppDispatch, useAppSelector } from '@state/store'
import { useViewsContext } from '@shared/containers'
import { ProjectTableModulesType } from '@shared/hooks'

const SCOPES = ['folder', 'task']

type Props = {
  modules: ProjectTableModulesType
  // the table instead of the whole page, e.g. an addon's EntityTable
  children?: ReactNode
  readOnly?: boolean
}

const ProjectOverviewTableProvider: FC<Props> = ({ modules, children, readOnly }) => {
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
  const { setPinnedSlice } = useSlicerContext()

  const handleResetView = useCallback(async () => {
    setPinnedSlice(null)
    await resetWorkingView()
  }, [resetWorkingView, setPinnedSlice])

  // a read-only table (an addon's EntityTable) has no details panel: the entity opens on Overview
  const navigate = useNavigate()
  const contextMenuItems = useMemo<ContextMenuItemConstructors>(() => {
    if (!readOnly) return props.contextMenuItems
    const openInOverview: ContextMenuItemConstructor = (_e, cell) => {
      const url = entityUrl({
        projectName: props.projectName,
        // a type without a page (e.g. a group row) gets no url
        entityType: cell.entityType ?? '',
        id: cell.entityId,
      })
      return {
        id: 'open-in-overview',
        label: 'Open in Overview',
        icon: 'open_in_new',
        command: () => url && navigate(url),
        hidden: !url || cell.isGroup,
      }
    }
    return [openInOverview, 'copy-paste', 'expand-collapse', 'export', 'open-viewer']
  }, [readOnly, props.contextMenuItems, props.projectName, navigate])

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

  const dispatch = useAppDispatch()
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
        readOnly={readOnly}
        contextMenuItems={contextMenuItems}
        scopes={SCOPES}
        playerOpen={viewerOpen}
        onOpenPlayer={handleOpenPlayer}
        // the rows are the addon's: there is no filter to reset
        onResetView={readOnly ? undefined : handleResetView}
        SubtasksManager={SubtasksManager}
        useParams={useParams}
        useNavigate={useNavigate}
        useLocation={useLocation}
        useSearchParams={useSearchParams}
        dispatch={dispatch}
      >
        <SelectionCellsProvider>
          <SelectedRowsProvider>
            <CellEditingProvider>
              {children ?? <ProjectOverviewPage />}
            </CellEditingProvider>
          </SelectedRowsProvider>
        </SelectionCellsProvider>
      </ProjectTableProvider>
    </ProjectTableQueriesProvider>
  )
}

export default ProjectOverviewTableProvider
