import { FC } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import {
  ProjectTableProvider,
  SelectionCellsProvider,
  SelectedRowsProvider,
  CellEditingProvider,
  DetailsPanelEntityProvider,
} from '@shared/containers/ProjectTreeTable'
import { NewEntityProvider } from '@context/NewEntityContext'
import { usePowerpack, useSubtasksModulesContext } from '@shared/context'
import { useProjectOverviewContext } from '../context/ProjectOverviewContext'
import { ProjectTableQueriesProvider } from '@shared/containers/ProjectTreeTable/context/ProjectTableQueriesContext'
import useTableQueriesHelper from '../hooks/useTableQueriesHelper'
import ProjectOverviewPage from '../ProjectOverviewPage'
import useTableOpenViewer from '../hooks/useTableOpenViewer'
import { useAppSelector } from '@state/store'
import { useViewsContext } from '@shared/containers'
import { ProjectTableModulesType } from '@shared/hooks'

const ProjectOverviewTableProvider: FC<{ modules: ProjectTableModulesType }> = ({ modules }) => {
  const { taskGroups, ...props } = useProjectOverviewContext()

  const { updateEntities, getFoldersTasks } = useTableQueriesHelper({
    projectName: props.projectName,
  })

  const { resetWorkingView } = useViewsContext()

  const powerpack = usePowerpack()
  const { SubtasksManager } = useSubtasksModulesContext()

  const viewerOpen = useAppSelector((state) => state.viewer.isOpen)
  const handleOpenPlayer = useTableOpenViewer({ projectName: props.projectName })

  return (
    <ProjectTableQueriesProvider {...{ updateEntities, getFoldersTasks }}>
      <ProjectTableProvider
        {...props}
        groups={taskGroups}
        powerpack={powerpack}
        modules={modules}
        groupByConfig={{ entityType: 'task' }}
        scopes={['folder', 'task']}
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
