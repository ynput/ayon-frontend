import useTableOpenViewer from '@pages/ProjectOverviewPage/hooks/useTableOpenViewer'
import {
  ContextMenuItemConstructors,
  ProjectTableProvider,
  useProjectDataContext,
  useProjectTableModules,
} from '@shared/containers'
import { useAppSelector } from '@state/store'
import { FC, useState } from 'react'
import { useVersionsDataContext } from '../context/VersionsDataContext'

interface VersionsProjectTableProviderProps {
  projectName: string
  children: React.ReactNode
}

export const VersionsProjectTableProvider: FC<VersionsProjectTableProviderProps> = ({
  projectName,
  children,
}) => {
  const { versionsTableData, versionsMap } = useVersionsDataContext()
  const modules = useProjectTableModules()

  const { attribFields, projectInfo, users } = useProjectDataContext()

  // expanded state of versions
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

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
      entitiesMap={versionsMap}
      foldersMap={foldersMap}
      tasksMap={tasksMap}
      tableRows={versionsTableData}
      expanded={expanded}
      setExpanded={(e) => setExpanded(e as any)}
      isInitialized={isInitialized}
      showHierarchy={false}
      isLoading={isLoadingAll}
      contextMenuItems={contextMenuItems}
      scopes={['version']}
      playerOpen={viewerOpen}
      onOpenPlayer={handleOpenPlayer}
    >
      {children}
    </ProjectTableProvider>
  )
}
