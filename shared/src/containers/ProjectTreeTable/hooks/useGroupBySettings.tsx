import { useColumnSettingsContext, useProjectTableContext } from '../context'
import { useGetGroupedFields } from '..'

interface UseGroupBySettingsProps {
  scope?: string
}

export const useGroupBySettings = ({ scope }: UseGroupBySettingsProps) => {
  const { groupBy, groupByConfig, updateGroupBy, updateGroupByConfig } = useColumnSettingsContext()
  const { modules } = useProjectTableContext()
  const groupByFields = useGetGroupedFields({ scope })
  if (!modules) return null
  const { GroupSettings, requiredVersion } = modules || {}

  return {
    id: 'group-by',
    title: 'Group',
    icon: 'splitscreen',
    preview: groupBy
      ? groupByFields.find((f) => f.value === groupBy.id)?.label ?? groupBy.id
      : 'None',
    component: (
      <GroupSettings
        fields={groupByFields}
        requiredVersion={requiredVersion}
        groupBy={groupBy}
        updateGroupBy={updateGroupBy}
        config={groupByConfig}
        onConfigChange={updateGroupByConfig}
      />
    ),
  }
}
