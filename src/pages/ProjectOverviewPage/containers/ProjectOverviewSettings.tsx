import {
  OverviewSettingsChange,
  ProjectTableSettings,
  ProjectTableSettingsProps,
} from '@shared/components'
import {
  useColumnSettingsContext,
  useProjectTableContext,
  useProjectTableModuleContext,
} from '@shared/containers'
import { getAttributeIcon } from '@shared/util'
import { FC } from 'react'

interface ProjectOverviewSettingsProps extends ProjectTableSettingsProps {
  onChange?: OverviewSettingsChange
}

const ProjectOverviewSettings: FC<ProjectOverviewSettingsProps> = ({ onChange, ...props }) => {
  const { groupBy, columnOrder, updateGroupBy } = useColumnSettingsContext()
  const { GroupSettings, requiredVersion } = useProjectTableModuleContext()
  const { attribFields } = useProjectTableContext()
  // @martastain says list_of_* is a pita to implement, so we are not supporting it for now
  const allowedGroupByFields = ['string', 'boolean', 'integer', 'float']

  const groupByFields = [
    {
      value: 'subType',
      label: 'Task Type',
      icon: getAttributeIcon('task'),
    },
    {
      value: 'assignees',
      label: 'Assignees',
      icon: getAttributeIcon('assignees'),
    },
    {
      value: 'status',
      label: 'Status',
      icon: getAttributeIcon('status'),
    },
    {
      value: 'tags',
      label: 'Tags',
      icon: getAttributeIcon('tags'),
    },
    ...attribFields
      .filter((attrib) => allowedGroupByFields.includes(attrib.data.type))
      .map((field) => ({
        value: 'attrib_' + field.name,
        label: field.data.title || field.name,
        icon: getAttributeIcon(field.name),
      })),
  ].sort((a, b) => {
    const indexA = columnOrder.indexOf(a.value)
    const indexB = columnOrder.indexOf(b.value)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  }) // Sort by column order

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
