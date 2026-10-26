import { ProjectTableSettings, ProjectTableSettingsProps } from '@shared/components'
import { useAddonTableColumns } from '@shared/containers/ProjectTreeTable'
import { useAddonCustomizeSections } from '@shared/components/ProjectTableSettings/useAddonCustomizeSections'
import { FC } from 'react'

interface ProjectOverviewSettingsProps extends Omit<ProjectTableSettingsProps, 'scope'> {}

const ProjectOverviewSettings: FC<ProjectOverviewSettingsProps> = ({ ...props }) => {
  const { settingsColumns } = useAddonTableColumns('overview')
  // sections addons contribute (projectTable.customizeSection slot)
  const addonSections = useAddonCustomizeSections('overview')
  return (
    <ProjectTableSettings
      {...props}
      settings={addonSections}
      scope={'task'}
      extraColumns={settingsColumns}
    />
  )
}

export default ProjectOverviewSettings
