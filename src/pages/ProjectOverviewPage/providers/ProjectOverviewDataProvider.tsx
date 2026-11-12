import { FC, ReactNode } from 'react'
import { ColumnSettingsProvider, ColumnDndProvider } from '@shared/containers/ProjectTreeTable'
import type { ContextMenuItemConstructors } from '@shared/containers/ProjectTreeTable'
import { useGroupByRemoteModules } from '@shared/hooks'
import { SettingsPanelProvider } from '@shared/context'
import { ProjectOverviewProvider } from '../context/project-overview'
import ProjectOverviewTableProvider from './ProjectOverviewTableProvider'
import { useOverviewViewSettings, useViewsContext, useViewUpdateHelper } from '@shared/containers'
import { DEFAULT_COLUMNS_FOLDER, DEFAULT_COLUMNS_TASK } from '@pages/ProjectsPage/constants'

// thumbnail, name, type, status are there by default unless specified
const DEFAULT_COLUMN_VISIBILITY = {
  ...DEFAULT_COLUMNS_TASK,
  ...DEFAULT_COLUMNS_FOLDER,
  entityType: true,
}

type Props = {
  // the table instead of the whole page, e.g. an addon's EntityTable
  children?: ReactNode
  readOnly?: boolean
  // keys the expanded rows; the Overview page's by default
  page?: string
  // replaces the Overview's right-click menu
  contextMenuItems?: ContextMenuItemConstructors
}

const ProjectOverviewDataProvider: FC<Props> = ({
  children,
  readOnly,
  page,
  contextMenuItems,
}) => {
  // view context and update helper
  const { viewSettings } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const { columns, onUpdateColumns } = useOverviewViewSettings({
    viewSettings,
    updateViewSettings,
  })

  const modules = useGroupByRemoteModules()

  return (
    <ColumnSettingsProvider
      config={columns}
      onChange={onUpdateColumns}
      defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
    >
      <ColumnDndProvider>
        <ProjectOverviewProvider modules={modules} page={page}>
          <SettingsPanelProvider>
            <ProjectOverviewTableProvider
              modules={modules}
              readOnly={readOnly}
              contextMenuItems={contextMenuItems}
            >
              {children}
            </ProjectOverviewTableProvider>
          </SettingsPanelProvider>
        </ProjectOverviewProvider>
      </ColumnDndProvider>
    </ColumnSettingsProvider>
  )
}

export default ProjectOverviewDataProvider
