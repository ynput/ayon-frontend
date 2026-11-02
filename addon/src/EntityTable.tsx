import { getHost } from './hostBridge'
import { Missing } from './layout'

/** What `EntityTable` lists: tasks and folders as on Overview, versions as on Products. */
export type EntityTableEntityType = 'task' | 'folder' | 'version'

/** One condition of an `EntityTableFilter`, as AYON's filter bar builds it. */
export interface EntityTableFilterCondition {
  /** the field: `status`, `taskType`, `attrib.priority`, `id`, ... */
  key: string
  value?: string | number | string[] | number[]
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
 * The rows, in the format of the Overview and Products filter bars (their saved views' `filter`):
 * conditions joined by `operator` (`and` by default), which may nest. A condition's id says which
 * entity it is about, as in the filter bar (`folder_status` vs `status`).
 */
export interface EntityTableFilter {
  conditions?: (EntityTableFilterCondition | EntityTableFilter)[]
  operator?: 'and' | 'or'
}

/**
 * The table's column settings, the same shape as the column settings of AYON's own views. Every
 * field is optional: a missing one is the table's default.
 */
export interface EntityTableColumns {
  /** column id → shown. Columns not listed use the table's defaults */
  columnVisibility?: Record<string, boolean>
  /** column ids, left to right */
  columnOrder?: string[]
  columnPinning?: { left?: string[]; right?: string[] }
  /** column id → width in px */
  columnSizing?: Record<string, number>
  sorting?: { id: string; desc: boolean }[]
  /** the field the rows are grouped by (`status`, `taskType`, `attrib.priority`, ...) */
  groupBy?: { id: string; desc: boolean }
  groupByConfig?: { showEmpty?: boolean }
  /** column id → the summaries row's calculation (`sum`, `avg`, `values`, `count`, ...) */
  columnSummaries?: Record<string, string>
  /** column id → which rows the summary counts: `all`, `primary`, `secondary`, `none` */
  columnSummaryScopes?: Record<string, string>
  /** column id → `count`, `percent`, `both` or `none` */
  columnSummaryFormats?: Record<string, string>
  rowHeight?: number
}

export interface EntityTableProps {
  /** the project the rows are in */
  projectName: string
  /**
   * `task`: Overview's task list. `folder`: Overview's folder list ("Group by: Folder"), each
   * folder expandable to its tasks. `version`: the versions table of Products.
   */
  entityType: EntityTableEntityType
  /** the rows, as the page's filter bar would filter them */
  filter?: EntityTableFilter
  /** or the rows by id (of `entityType`); with `filter` too, the rows match both */
  ids?: string[]
  /**
   * The column settings. Controlled when set: keep the value from `onColumnsChange` and pass it
   * back. Without it the table keeps the user's changes while it is mounted.
   */
  columns?: EntityTableColumns
  /** the user changed a column setting (shown columns, order, width, sorting, group by, summaries) */
  onColumnsChange?: (columns: EntityTableColumns) => void
  /** columns the table never offers */
  excludedColumns?: string[]
  /** on the table's wrapper, which fills its parent: give the parent a height */
  className?: string
}

/**
 * AYON's project table: the task and folder lists of Overview and the versions table of Products,
 * with their columns, sorting, group by, summaries row and loading on scroll, for the given rows.
 * It brings its own providers, so it works anywhere: a project page, a studio page, a dialog.
 * Read-only.
 *
 * ```tsx
 * <EntityTable
 *   projectName={projectName}
 *   entityType="task"
 *   filter={{ conditions: [{ key: 'status', operator: 'in', value: ['In progress'] }] }}
 *   columns={columns}
 *   onColumnsChange={setColumns}
 * />
 * ```
 */
export const EntityTable = (props: EntityTableProps) => {
  const Host = getHost().components?.EntityTable
  return Host ? <Host {...props} /> : <Missing name="EntityTable" />
}
