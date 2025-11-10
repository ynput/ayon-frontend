import useTableOpenViewer from '@pages/ProjectOverviewPage/hooks/useTableOpenViewer'
import { ProjectTableProvider, useProjectDataContext, useViewsContext } from '@shared/containers'
import { useAppSelector } from '@state/store'
import { FC } from 'react'
import { useVersionsDataContext } from '../context/VPDataContext'
import { buildVersionRow } from '../util'
import { useVPViewsContext } from '../context/VPViewsContext'
import { useProjectContext } from '@shared/context'

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
  const { versionsTableData, entitiesMap, groups, expanded, updateExpanded, error } =
    useVersionsDataContext()

  const { resetWorkingView } = useViewsContext()
  const { showProducts } = useVPViewsContext()

  const { ...projectInfo } = useProjectContext()
  const { attribFields, users } = useProjectDataContext()

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
      groupByConfig={{ entityType: 'version' }}
      groupRowFunc={buildVersionRow}
      expanded={expanded}
      updateExpanded={updateExpanded}
      isInitialized={isInitialized}
      showHierarchy={false}
      isLoading={isLoadingAll}
      scopes={showProducts ? ['version', 'product'] : ['version']}
      playerOpen={viewerOpen}
      onOpenPlayer={handleOpenPlayer}
      error={error}
      onResetView={resetWorkingView}
    >
      {children}
    </ProjectTableProvider>
  )
}
