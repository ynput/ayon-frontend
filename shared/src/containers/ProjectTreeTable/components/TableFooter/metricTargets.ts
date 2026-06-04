import type { VisibilityState } from '@tanstack/react-table'

// GraphQL StatsAggregation enum names (backend field_stats.py). SUM exists in
// the enum but isn't implemented in generate_specific_stats_columns — don't
// request it. Percentages derive from FILLED/NOT_FILLED server-side.
export type StatsAggregation = 'MIN' | 'MAX' | 'AVG' | 'FILLED' | 'NOT_FILLED' | 'CHECKED' | 'NOT_CHECKED'

export type MetricTarget = {
  field: string // column or dot-path for JSONB, e.g. 'status' / 'attrib.fps'
  aggregations: StatsAggregation[]
}

export type StatsEntity = 'folder' | 'task' | 'product' | 'version'

const COUNTS: StatsAggregation[] = ['FILLED', 'NOT_FILLED']
const NUMERIC: StatsAggregation[] = ['MIN', 'MAX', 'AVG']

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
  data?: { type?: string }
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
  const isVisible = (columnId: string) => columnVisibility[columnId]

  // name counts always — they feed the main folders/tasks count cell
  const targets: MetricTarget[] = [{ field: 'name', aggregations: COUNTS }]

  if (isVisible('status')) targets.push({ field: 'status', aggregations: COUNTS })

  const subTypeField = SUB_TYPE_FIELD[entity]
  if (subTypeField && isVisible('subType')) {
    targets.push({ field: subTypeField, aggregations: COUNTS })
  }

  for (const field of extraFields) {
    targets.push({ field, aggregations: COUNTS })
  }

  for (const attrib of attribs) {
    if (attrib.scope && !attrib.scope.includes(entity)) continue
    if (!isVisible(`attrib_${attrib.name}`)) continue

    const field = `attrib.${attrib.name}`
    const type = attrib.data?.type
    if (type === 'integer' || type === 'float') {
      targets.push({ field, aggregations: NUMERIC })
    } else if (type === 'string') {
      targets.push({ field, aggregations: COUNTS })
    }
  }

  return targets
}
