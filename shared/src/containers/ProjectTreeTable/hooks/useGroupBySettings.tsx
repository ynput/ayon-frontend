import { useCallback } from 'react'
import { useColumnSettingsContext, useProjectTableContext } from '../context'
import { useGetGroupedFields } from '..'
import { TableGroupBy } from '@shared/containers'

const HIERARCHY_ID = 'hierarchy'
const FOLDER_ID = 'folder'
const NAME_SORT_COLUMN = 'name'

interface UseGroupBySettingsProps {
  scope?: string
}

export const useGroupBySettings = ({ scope }: UseGroupBySettingsProps) => {
  const { groupBy, groupByConfig, updateGroupBy, updateGroupByConfig, sorting, updateSorting } =
    useColumnSettingsContext()
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
  const baseVirtualGroupBy =
    groupBy ?? (hasHierarchy && isHierarchyActive ? { id: HIERARCHY_ID, desc: false } : undefined)
  const nameSortDesc =
    sorting?.[0]?.id === NAME_SORT_COLUMN ? !!sorting[0].desc : false
  const virtualGroupBy =
    baseVirtualGroupBy?.id === FOLDER_ID || baseVirtualGroupBy?.id === HIERARCHY_ID
      ? { ...baseVirtualGroupBy, desc: nameSortDesc }
      : baseVirtualGroupBy

  // Wrap updateGroupBy to intercept "hierarchy", "folder" and "none" selection
  const handleUpdateGroupBy = useCallback(
    (newGroupBy: TableGroupBy | undefined) => {
      if (newGroupBy?.id === HIERARCHY_ID || newGroupBy?.id === FOLDER_ID) {
        const isAlreadyActive =
          newGroupBy.id === HIERARCHY_ID ? isHierarchyActive : groupBy?.id === FOLDER_ID
        if (isAlreadyActive) {
          if (newGroupBy.desc !== nameSortDesc) {
            updateSorting([{ id: NAME_SORT_COLUMN, desc: !!newGroupBy.desc }])
          }
          return
        }
        if (newGroupBy.id === HIERARCHY_ID) {
          updateShowHierarchy?.(true)
        } else {
          updateGroupBy(newGroupBy)
        }
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
    [updateGroupBy, updateShowHierarchy, updateSorting, groupBy, nameSortDesc, isHierarchyActive],
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
