import { ProjectTableSettings, ProjectTableSettingsProps } from '@shared/components'
import { useAddonTableColumns } from '@shared/containers/ProjectTreeTable'
import { FC } from 'react'

interface ProjectOverviewSettingsProps extends Omit<ProjectTableSettingsProps, 'scope'> {}

const ProjectOverviewSettings: FC<ProjectOverviewSettingsProps> = ({ ...props }) => {
  const { settingsColumns } = useAddonTableColumns('overview')
  return (
    <ProjectTableSettings {...props} settings={[]} scope={'task'} extraColumns={settingsColumns} />
  )
}

export default ProjectOverviewSettings
