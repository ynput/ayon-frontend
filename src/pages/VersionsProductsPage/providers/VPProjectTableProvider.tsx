import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import useTableOpenViewer from '@pages/ProjectOverviewPage/hooks/useTableOpenViewer'
import {
  ProjectTableProvider,
  useProjectDataContext,
  useViewsContext,
  useColumnSettingsContext,
  useGroupCounts,
} from '@shared/containers'
import { useAppSelector } from '@state/store'
import { FC, useMemo } from 'react'
import { useVersionsDataContext } from '../context/VPDataContext'
import { buildVersionRow } from '../util'
import { useVPViewsContext } from '../context/VPViewsContext'
import { useProjectContext, useSubtasksModulesContext } from '@shared/context'

interface VPProjectTableProviderProps {
  projectName: string
  children: React.ReactNode
  modules: any
}

export const VPProjectTableProvider: FC<VPProjectTableProviderProps> = ({
  projectName,
  modules,
  children,
}) => {
  const { versionsTableData, entitiesMap, groups, expanded, updateExpanded, error, columnStatsArgs } =
    useVersionsDataContext()

  const { resetWorkingView, isLoadingViews } = useViewsContext()

  // filter-aware per-group counts for the active grouping (community: not license-gated)
  const { groupBy } = useColumnSettingsContext()
  const { counts: groupCounts, complete: groupCountsComplete } = useGroupCounts({
    entity: 'version',
    groupBy,
    skip: isLoadingViews,
    args: columnStatsArgs,
  })
  const { showProducts, onUpdateShowProducts } = useVPViewsContext()

  const { ...projectInfo } = useProjectContext()
  const { attribFields, users } = useProjectDataContext()
  const { SubtasksManager } = useSubtasksModulesContext()

  const hierarchyOptions = useMemo(
    () => [{ value: 'hierarchy', label: 'Product', icon: 'inventory_2' }],
    [],
  )

  const SCOPES = useMemo(
    () => (showProducts ? ['version', 'product'] : ['version']),
    [showProducts],
  )

  // loading states
  const isInitialized = true // replace with actual state
  const isLoadingAll = false // replace with actual state

  // place holders, do we even need these?
  const foldersMap = new Map()
  const tasksMap = new Map()

  // external player state
  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)
  const handleOpenPlayer = useTableOpenViewer({ projectName: projectName })

  return (
    <ProjectTableProvider
      projectName={projectName}
      modules={modules}
      // @ts-ignore
      attribFields={attribFields}
      projectInfo={projectInfo}
      users={users}
      entitiesMap={entitiesMap}
      foldersMap={foldersMap}
      tasksMap={tasksMap}
      tableRows={versionsTableData}
      groups={groups}
      groupCounts={groupCounts}
      groupCountsComplete={groupCountsComplete}
      groupByConfig={{ entityType: 'version' }}
      hierarchyOptions={hierarchyOptions}
      groupRowFunc={buildVersionRow}
      expanded={expanded}
      updateExpanded={updateExpanded}
      isInitialized={isInitialized}
      showHierarchy={false}
      updateShowHierarchy={onUpdateShowProducts}
      hierarchyActive={showProducts}
      isLoading={isLoadingAll}
      scopes={SCOPES}
      playerOpen={viewerOpen}
      onOpenPlayer={handleOpenPlayer}
      error={error}
      onResetView={resetWorkingView}
      SubtasksManager={SubtasksManager}
      useParams={useParams}
      useNavigate={useNavigate}
      useLocation={useLocation}
      useSearchParams={useSearchParams}
    >
      {children}
    </ProjectTableProvider>
  )
}
