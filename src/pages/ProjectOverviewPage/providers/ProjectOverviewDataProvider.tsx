import { FC } from 'react'
import {
  ColumnSettingsProvider,
  ProjectDataProvider,
  ColumnDndProvider,
} from '@shared/containers/ProjectTreeTable'
import { useGroupByRemoteModules } from '@shared/hooks'
import { SettingsPanelProvider, MoveEntityProvider } from '@shared/context'
import { useAppSelector } from '@state/store'
import { ProjectOverviewProvider } from '../context/ProjectOverviewContext'
import ProjectOverviewTableProvider from './ProjectOverviewTableProvider'
import { useOverviewViewSettings, useViewsContext, useViewUpdateHelper } from '@shared/containers'
import { DEFAULT_COLUMNS_FOLDER, DEFAULT_COLUMNS_TASK } from '@pages/ProjectsPage/constants'

// thumbnail, name, type, status are there by default unless specified
const DEFAULT_COLUMN_VISIBILITY = {
  ...DEFAULT_COLUMNS_TASK,
  ...DEFAULT_COLUMNS_FOLDER,
  entityType: true,
}

const ProjectOverviewDataProvider: FC = () => {
  const projectName = useAppSelector((state) => state.project.name) || ''

  // view context and update helper
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const { columns, onUpdateColumns } = useOverviewViewSettings({
    viewSettings,
    updateViewSettings,
  })

  const modules = useGroupByRemoteModules()

  return (
    <ProjectDataProvider projectName={projectName}>
      <ColumnSettingsProvider
        config={columns}
        onChange={onUpdateColumns}
        defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
      >
        <ColumnDndProvider>
          <MoveEntityProvider>
            <ProjectOverviewProvider modules={modules}>
              <SettingsPanelProvider>
                <ProjectOverviewTableProvider modules={modules} />
              </SettingsPanelProvider>
            </ProjectOverviewProvider>
          </MoveEntityProvider>
        </ColumnDndProvider>
      </ColumnSettingsProvider>
    </ProjectDataProvider>
  )
}

export default ProjectOverviewDataProvider
