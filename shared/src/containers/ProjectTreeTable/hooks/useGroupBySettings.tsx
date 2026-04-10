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
  const { modules, showHierarchy, updateShowHierarchy, hierarchyOptions: customHierarchyOptions, hierarchyActive, } = useProjectTableContext()
  const groupByFields = useGetGroupedFields({ scope })
  if (!modules) return null
  const { GroupSettings, requiredVersion } = modules || {}

  // Add hierarchy-like options when the table supports it
  const hasHierarchy = !!updateShowHierarchy
  const defaultHierarchyOptions = [
    { value: HIERARCHY_ID, label: 'Hierarchy', icon: 'account_tree' },
    { value: 'folder', label: 'Folder', icon: 'folder' },
  ]
  const fields = hasHierarchy
    ? [...(customHierarchyOptions || defaultHierarchyOptions), ...groupByFields]
    : groupByFields

  // When hierarchy is active (groupBy is undefined), present a virtual groupBy
  // so the GroupSettings component highlights the hierarchy option as selected
  // hierarchyActive overrides showHierarchy for panel display when table behavior differs
  const isHierarchyActive = hierarchyActive ?? showHierarchy
  const virtualGroupBy =
    groupBy ?? (hasHierarchy && isHierarchyActive ? { id: HIERARCHY_ID, desc: false } : undefined)

  // Wrap updateGroupBy to intercept "hierarchy" and "none" selection
  const handleUpdateGroupBy = useCallback(
    (newGroupBy: TableGroupBy | undefined) => {
      if (newGroupBy?.id === HIERARCHY_ID) {
        // Hierarchy selected: delegate entirely to updateShowHierarchy
        // which routes through onUpdateViewGroupBy('hierarchy') and also
        // sets localColumns.groupBy = undefined — no need to call updateGroupBy separately
        updateShowHierarchy?.(true)
        return
      }
      if (!newGroupBy) {
        // None selected: flat list (no hierarchy, no grouping)
        if (updateShowHierarchy) {
          // Has hierarchy support: delegate to updateShowHierarchy(false)
          // which routes through onUpdateViewGroupBy(undefined) and clears everything
          updateShowHierarchy(false)
        } else {
          // No hierarchy support: just clear groupBy through ColumnSettingsContext
          updateGroupBy(undefined)
        }
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
        sortDisabled={virtualGroupBy?.id === 'hierarchy' || virtualGroupBy?.id === 'folder'}
      />
    ),
  }
}
