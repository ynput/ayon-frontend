import { ProjectTableSettings, ProjectTableSettingsProps } from '@shared/components'
import {
  useAddonTableColumns,
  useProjectTableContext,
  useTaskColumns,
} from '@shared/containers/ProjectTreeTable'
import { useAddonCustomizeSections } from '@shared/components/ProjectTableSettings/useAddonCustomizeSections'
import { FC, useMemo } from 'react'

interface ProjectOverviewSettingsProps extends Omit<ProjectTableSettingsProps, 'scope'> {}

const ProjectOverviewSettings: FC<ProjectOverviewSettingsProps> = ({ ...props }) => {
  const { settingsColumns: addonSettingsColumns } = useAddonTableColumns('overview')
  const { showHierarchy, isFlatFolderView } = useProjectTableContext()
  const { settingsColumns: taskSettingsColumns } = useTaskColumns(
    showHierarchy || !!isFlatFolderView,
  )
  const settingsColumns = useMemo(
    () => [...taskSettingsColumns, ...addonSettingsColumns],
    [taskSettingsColumns, addonSettingsColumns],
  )
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
