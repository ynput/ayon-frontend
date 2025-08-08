import { FC } from 'react'
import {
  ProjectTableProvider,
  SelectionCellsProvider,
  SelectedRowsProvider,
  CellEditingProvider,
  DetailsPanelEntityProvider,
  ProjectTableModulesType,
} from '@shared/containers/ProjectTreeTable'
import { NewEntityProvider } from '@context/NewEntityContext'
import { usePowerpack } from '@shared/context'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'
import { ProjectTableQueriesProvider } from '@shared/containers/ProjectTreeTable/context/ProjectTableQueriesContext'
import useTableQueriesHelper from '../hooks/useTableQueriesHelper'
import ProjectOverviewPage from '../ProjectOverviewPage'
import useTableOpenViewer from '../hooks/useTableOpenViewer'
import { useAppSelector } from '@state/store'

const ProjectOverviewTableProvider: FC<{ modules: ProjectTableModulesType }> = ({ modules }) => {
  const props = useProjectOverviewContext()

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: props.projectName,
  })

  const powerpack = usePowerpack()

  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)
  const handleOpenPlayer = useTableOpenViewer({ projectName: props.projectName })

  return (
    <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
      <ProjectTableProvider
        {...props}
        powerpack={powerpack}
        modules={modules}
        groupByConfig={{ entityType: 'task' }}
        scopes={['folder', 'task']}
        playerOpen={viewerOpen}
        onOpenPlayer={handleOpenPlayer}
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
