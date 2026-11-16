import type { EntityTableProps, EntityTableSettings } from '@ynput/ayon-addon'
import type { OverviewSettings } from '@shared/api'

// what the user may change in the table; the rest of the view settings is the host's
const SETTINGS_KEYS: (keyof EntityTableSettings)[] = [
  'columns',
  'sortBy',
  'sortDesc',
  'groupBy',
  'groupSortByDesc',
  'showEmptyGroups',
  'rowHeight',
]

type RowsInput = Pick<EntityTableProps, 'entityType' | 'filter' | 'ids'>

/** The Overview's view settings for the addon's rows and the user's settings. */
export const toOverviewSettings = (
  { entityType, filter, ids }: RowsInput,
  settings: EntityTableSettings,
): OverviewSettings => {
  const conditions = [
    ...(filter ? [filter] : []),
    // folder_ puts the condition on the folders (the filter bar's scope prefix)
    ...(ids
      ? [{ key: entityType === 'folder' ? 'folder_id' : 'id', operator: 'in' as const, value: ids }]
      : []),
  ]
  return {
    ...settings,
    showHierarchy: false,
    // 'folder' is the Overview's flat folder view: each folder expandable to its tasks
    groupBy: entityType === 'folder' ? 'folder' : settings.groupBy,
    // tasks: most groups would be empty; folders: false would hide folders without tasks
    showEmptyGroups: settings.showEmptyGroups ?? entityType !== 'task',
    filter: { operator: 'and', conditions },
  }
}

/** The user's changed view settings merged into the addon's settings. */
export const toEntityTableSettings = (
  viewSettings: Record<string, unknown>,
  entityType: EntityTableProps['entityType'],
  previous: EntityTableSettings,
): EntityTableSettings => {
  // the folder view's groupBy is the host's
  const keys = SETTINGS_KEYS.filter(
    (key) => key in viewSettings && !(key === 'groupBy' && entityType === 'folder'),
  )
  return { ...previous, ...Object.fromEntries(keys.map((key) => [key, viewSettings[key]])) }
}
