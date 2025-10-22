import useTableOpenViewer from '@pages/ProjectOverviewPage/hooks/useTableOpenViewer'
import {
  ContextMenuItemConstructors,
  ProjectTableProvider,
  useProjectDataContext,
  useProjectTableModules,
  useVersionsViewSettings,
  useViewsContext,
} from '@shared/containers'
import { useAppSelector } from '@state/store'
import { FC } from 'react'
import { useVersionsDataContext } from '../context/VersionsDataContext'

interface VersionsProjectTableProviderProps {
  projectName: string
  children: React.ReactNode
}

export const VersionsProjectTableProvider: FC<VersionsProjectTableProviderProps> = ({
  projectName,
  children,
}) => {
  const { versionsTableData, entitiesMap, expanded, updateExpanded, error } =
    useVersionsDataContext()
  const modules = useProjectTableModules()
  const { resetWorkingView } = useViewsContext()
  const { showProducts } = useVersionsViewSettings()

  const { attribFields, projectInfo, users } = useProjectDataContext()

  // loading states
  const isInitialized = true // replace with actual state
  const isLoadingAll = false // replace with actual state

  // extra context menu items
  const contextMenuItems: ContextMenuItemConstructors = [] // replace with actual context menu items

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
      expanded={expanded}
      updateExpanded={updateExpanded}
      isInitialized={isInitialized}
      showHierarchy={false}
      isLoading={isLoadingAll}
      contextMenuItems={contextMenuItems}
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
