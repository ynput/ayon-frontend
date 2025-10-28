import { OverviewSettingsChange } from '@shared/components'
import { FC } from 'react'
import { useColumnSettingsContext, useProjectTableContext } from '../context'
import { useGetGroupedFields } from '..'

interface UseGroupBySettingsProps {
  scope?: string
}

export const useGroupBySettings = ({ scope }: UseGroupBySettingsProps) => {
  const { groupBy, groupByConfig, updateGroupBy, updateGroupByConfig } = useColumnSettingsContext()
  const { modules } = useProjectTableContext()
  const { GroupSettings, requiredVersion } = modules

  const groupByFields = useGetGroupedFields({ scope })
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
