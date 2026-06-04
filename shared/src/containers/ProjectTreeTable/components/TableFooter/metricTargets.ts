import type { VisibilityState } from '@tanstack/react-table'

// GraphQL StatsAggregation enum names (backend field_stats.py).
// Percentages derive from FILLED/NOT_FILLED server-side.
export type StatsAggregation =
  | 'MIN'
  | 'MAX'
  | 'AVG'
  | 'SUM'
  | 'FILLED'
  | 'NOT_FILLED'
  | 'CHECKED'
  | 'NOT_CHECKED'
  | 'DISTRIBUTION'

export type MetricTarget = {
  field: string // column or dot-path for JSONB, e.g. 'status' / 'attrib.fps'
  aggregations: StatsAggregation[]
}

export type StatsEntity = 'folder' | 'task' | 'product' | 'version'

// Array-column stats (tags/assignees) need backend support not yet merged
// (cardinality/unnest templates posted on ayon-backend PR #943). On an
// unpatched server those targets fail the whole stats query with
// "malformed array literal". Flip to true once the backend ships it.
export const ARRAY_STATS_READY = false

const COUNTS: StatsAggregation[] = ['FILLED', 'NOT_FILLED']
// FILLED rides along so combined-scope averages can be weighted exactly
const NUMERIC: StatsAggregation[] = ['MIN', 'MAX', 'AVG', 'SUM', 'FILLED', 'NOT_FILLED']
// enum columns: counts power the fallback display, distribution the colored bar
const ENUM: StatsAggregation[] = ['FILLED', 'NOT_FILLED', 'DISTRIBUTION']

// The table's unified subType column per entity (result columnName maps back
// to subType via COLUMN_ALIASES in mapColumnStats).
const SUB_TYPE_FIELD: Record<StatsEntity, string | null> = {
  folder: 'folder_type',
  task: 'task_type',
  product: 'product_type',
  version: null,
}

// Structural subset of ProjectTableAttribute — two near-identical versions of
// that type exist (types/index vs hooks/useAttributesList, data.type optional
// in the latter); only these fields are needed here so accept both.
type AttribFieldLike = {
  name: string
  scope?: string[] | null
  data?: { type?: string; enum?: unknown[] }
}

type BuildMetricTargetsArgs = {
  entity: StatsEntity
  attribs: AttribFieldLike[]
  columnVisibility: VisibilityState
  extraFields?: string[] // visible page-specific columns, e.g. 'product_base_type'
}

// Targets for the footer over the columns the user can actually see.
// Skipped on purpose (backend SQL can't aggregate them safely yet):
// datetime (numeric cast fails), boolean attribs (text-vs-bool compare on
// JSONB), array columns (assignees/tags) and list-type attribs.
export const buildMetricTargets = ({
  entity,
  attribs,
  columnVisibility,
  extraFields = [],
}: BuildMetricTargetsArgs): MetricTarget[] => {
  // TanStack visibility map only stores toggled columns — absent means visible.
  const isVisible = (columnId: string) => columnVisibility[columnId] !== false

  const targets: MetricTarget[] = []
  if (entity === 'version') {
    // versions have no `name` column (display name derives from the version
    // number) — status is non-null and doubles as the row-count anchor
    targets.push({ field: 'status', aggregations: ENUM })
  } else {
    // name counts always — they feed the main folders/tasks count cell
    targets.push({ field: 'name', aggregations: COUNTS })
    if (isVisible('status')) targets.push({ field: 'status', aggregations: ENUM })
  }
  if (ARRAY_STATS_READY) {
    // array columns (VARCHAR[]) — backend unnests for distribution / cardinality for counts
    if (isVisible('tags')) targets.push({ field: 'tags', aggregations: ENUM })
    if (entity === 'task' && isVisible('assignees')) {
      targets.push({ field: 'assignees', aggregations: ENUM })
    }
  }

  const subTypeField = SUB_TYPE_FIELD[entity]
  if (subTypeField && isVisible('subType')) {
    targets.push({ field: subTypeField, aggregations: ENUM })
  }

  for (const field of extraFields) {
    targets.push({ field, aggregations: ENUM })
  }

  for (const attrib of attribs) {
    if (attrib.scope && !attrib.scope.includes(entity)) continue
    if (!isVisible(`attrib_${attrib.name}`)) continue

    const field = `attrib.${attrib.name}`
    const type = attrib.data?.type
    if (type === 'integer' || type === 'float') {
      targets.push({ field, aggregations: NUMERIC })
    } else if (type === 'string') {
      targets.push({ field, aggregations: attrib.data?.enum?.length ? ENUM : COUNTS })
    }
  }

  return targets
}
