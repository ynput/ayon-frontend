import { getHost } from './hostBridge'
import { Missing } from './layout'

/** What `EntityTable` lists: tasks, or folders each expandable to its tasks, as on Overview. */
export type EntityTableEntityType = 'task' | 'folder'

/** One condition of an `EntityTableFilter`, as AYON's filter bar builds it. */
export interface EntityTableFilterCondition {
  /** the field: `status`, `taskType`, `assignees`, `attrib.priority`, ...; `folder_` for folders */
  key: string
  value?: string | number | boolean | null | string[] | number[]
  operator?:
    | 'eq'
    | 'like'
    | 'notlike'
    | 'lt'
    | 'gt'
    | 'lte'
    | 'gte'
    | 'ne'
    | 'isnull'
    | 'notnull'
    | 'in'
    | 'notin'
    | 'includes'
    | 'excludes'
    | 'includesall'
    | 'excludesall'
    | 'includesany'
    | 'excludesany'
}

/**
 * The rows, in the format of the Overview filter bar (a saved view's `filter`): conditions joined
 * by `operator` (`and` by default), which may nest. A key without a prefix is about tasks,
 * `folder_<key>` about folders (`folder_status`, `folder_folderType`). Task and folder conditions
 * are always joined by `and`: keep an `or` within one of them.
 */
export interface EntityTableFilter {
  conditions?: (EntityTableFilterCondition | EntityTableFilter)[]
  operator?: 'and' | 'or'
}

/** A column of the table, as AYON's views store it. */
export interface EntityTableColumn {
  /** the column id: `status`, `assignees`, `attrib_priority`, ... */
  name: string
  /** a listed column without `visible` is hidden; columns not listed use the table's defaults */
  visible?: boolean
  pinned?: boolean
  /** in px */
  width?: number
  /** the summaries row's calculation: `sum`, `avg`, `values`, `count`, ... */
  summary?: string
  /** which rows the summary counts: `all`, `primary`, `secondary`, `none` */
  summaryScope?: string
  /** `count`, `percent`, `both` or `none` */
  summaryFormat?: string
}

/** What the user can change in the table, the same keys as in AYON's saved views. */
export interface EntityTableSettings {
  /** left to right */
  columns?: EntityTableColumn[]
  sortBy?: string | string[]
  sortDesc?: boolean
  /** tasks only: the field the rows are grouped by (`status`, `taskType`, `attrib.priority`, ...) */
  groupBy?: string
  groupSortByDesc?: boolean
  showEmptyGroups?: boolean
  rowHeight?: number
}

export interface EntityTableProps {
  /** the project the rows are in; it may be another project than the page's */
  projectName: string
  entityType: EntityTableEntityType
  /** the rows, as the Overview filter bar would filter them */
  filter?: EntityTableFilter
  /**
   * the rows by id (of `entityType`); with `filter` too, the rows match both. `[]`: no rows. Every
   * table request carries them, so keep the list to what the user can look through (a few thousand)
   */
  ids?: string[]
  /**
   * Controlled when set: keep the value from `onSettingsChange` and pass it back. Without it the
   * table keeps the user's changes while it is mounted.
   */
  settings?: EntityTableSettings
  /** the user changed a column, the sorting, the grouping or the row height */
  onSettingsChange?: (settings: EntityTableSettings) => void
  /** columns the table never shows; the user can't add them */
  excludedColumns?: string[]
  /** on the table's wrapper, which fills its parent: give the parent a height */
  className?: string
}

/**
 * AYON's project table, as on Overview: columns, sorting, grouping, summaries row and loading on
 * scroll, for the rows you give it. Read-only. It loads the project's data itself, so it works
 * anywhere: a project page, a studio page, a dialog.
 *
 * ```tsx
 * <EntityTable
 *   projectName={projectName}
 *   entityType="task"
 *   filter={{ conditions: [{ key: 'status', operator: 'in', value: ['In progress'] }] }}
 *   settings={settings}
 *   onSettingsChange={setSettings}
 * />
 * ```
 */
export const EntityTable = (props: EntityTableProps) => {
  const Host = getHost().components?.EntityTable
  return Host ? <Host {...props} /> : <Missing name="EntityTable" />
}
