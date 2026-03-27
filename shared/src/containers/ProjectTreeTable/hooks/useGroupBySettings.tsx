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

  // Add Hierarchy and Folder options when the table supports it
  const hasHierarchy = !!updateShowHierarchy
  const fields = hasHierarchy
    ? [
        { value: HIERARCHY_ID, label: 'Hierarchy', icon: 'account_tree' },
        { value: 'folder', label: 'Folder', icon: 'folder' },
        ...groupByFields,
      ]
    : groupByFields

  // When hierarchy is active (groupBy is undefined), present a virtual groupBy
  // so the GroupSettings component highlights "Hierarchy" as selected
  const virtualGroupBy =
    groupBy ?? (hasHierarchy && showHierarchy ? { id: HIERARCHY_ID, desc: false } : undefined)

  // Wrap updateGroupBy to intercept "hierarchy" and "none" selection
  const handleUpdateGroupBy = useCallback(
    (newGroupBy: TableGroupBy | undefined) => {
      if (newGroupBy?.id === HIERARCHY_ID) {
        // Hierarchy selected: show tree structure
        updateShowHierarchy?.(true)
        updateGroupBy(undefined)
        return
      }
      if (!newGroupBy) {
        // None selected: flat list (no hierarchy, no grouping)
        updateShowHierarchy?.(false)
        updateGroupBy(undefined)
        return
      }
      updateGroupBy(newGroupBy)
    },
    [updateGroupBy, updateShowHierarchy],
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
