import { ProjectTableSettings, ProjectTableSettingsProps } from '@shared/components'
import { FC } from 'react'

interface ProjectOverviewSettingsProps extends Omit<ProjectTableSettingsProps, 'scope'> {}

const ProjectOverviewSettings: FC<ProjectOverviewSettingsProps> = ({ ...props }) => {
  return <ProjectTableSettings {...props} settings={[]} scope={'task'} />
}

export default ProjectOverviewSettings
