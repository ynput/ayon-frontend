import { useCallback } from 'react'
import { useColumnSettingsContext, useProjectTableContext } from '../context'
import { useGetGroupedFields } from '..'
import { TableGroupBy } from '@shared/containers'

const HIERARCHY_ID = 'hierarchy'

interface UseGroupBySettingsProps {
  scope?: string
}

export const useGroupBySettings = ({ scope }: UseGroupBySettingsProps) => {
  const { groupBy, groupByConfig, updateGroupBy, updateGroupByConfig } = useColumnSettingsContext()
  const { modules, showHierarchy, updateShowHierarchy } = useProjectTableContext()
  const groupByFields = useGetGroupedFields({ scope })
  if (!modules) return null
  const { GroupSettings, requiredVersion } = modules || {}

  // Add Hierarchy option when the table supports it
  const hasHierarchy = !!updateShowHierarchy
  const fields = hasHierarchy
    ? [{ value: HIERARCHY_ID, label: 'Hierarchy', icon: 'account_tree' }, ...groupByFields]
    : groupByFields

  // When hierarchy is active (groupBy is undefined), present a virtual groupBy
  // so the GroupSettings component highlights "Hierarchy" as selected
  const virtualGroupBy =
    groupBy ?? (hasHierarchy && showHierarchy ? { id: HIERARCHY_ID, desc: false } : undefined)

  // Wrap updateGroupBy to intercept "hierarchy" selection
  const handleUpdateGroupBy = useCallback(
    (newGroupBy: TableGroupBy | undefined) => {
      if (newGroupBy?.id === HIERARCHY_ID || !newGroupBy) {
        // Clear groupBy — the sync effect in ProjectOverviewContext
        // will set viewGroupBy to null (hierarchy mode)
        updateGroupBy(undefined)
        return
      }
      updateGroupBy(newGroupBy)
    },
    [updateGroupBy],
  )

  const preview = virtualGroupBy
    ? fields.find((f) => f.value === virtualGroupBy.id)?.label ?? virtualGroupBy.id
    : 'None'

  return {
    id: 'group-by',
    title: 'Group',
    icon: 'splitscreen',
    preview,
    component: (
      <GroupSettings
        fields={fields}
        requiredVersion={requiredVersion}
        groupBy={virtualGroupBy}
        updateGroupBy={handleUpdateGroupBy}
        config={groupByConfig}
        onConfigChange={updateGroupByConfig}
      />
    ),
  }
}
