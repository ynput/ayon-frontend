import {
  OverviewSettingsChange,
  ProjectTableSettings,
  ProjectTableSettingsProps,
} from '@shared/components'
import {
  useColumnSettingsContext,
  useGetGroupedFields,
  useProjectTableContext,
} from '@shared/containers/ProjectTreeTable'
import { FC } from 'react'

interface ProjectOverviewSettingsProps extends ProjectTableSettingsProps {
  onChange?: OverviewSettingsChange
}

const ProjectOverviewSettings: FC<ProjectOverviewSettingsProps> = ({ onChange, ...props }) => {
  const { groupBy, updateGroupBy } = useColumnSettingsContext()
  const { modules } = useProjectTableContext()
  const { GroupSettings, requiredVersion } = modules

  const groupByFields = useGetGroupedFields()

  return (
    <ProjectTableSettings
      {...props}
      settings={[
        {
          id: 'group-by',
          title: 'Group',
          icon: 'splitscreen',
          preview: groupBy
            ? groupByFields.find((f) => f.value === groupBy.id)?.label ?? groupBy.id
            : 'None',
          component: (
            <GroupSettings
              fields={groupByFields}
              onChange={(v) => onChange?.('group-by', v)}
              requiredVersion={requiredVersion}
              groupBy={groupBy}
              updateGroupBy={updateGroupBy}
            />
          ),
        },
      ]}
    />
  )
}

export default ProjectOverviewSettings
