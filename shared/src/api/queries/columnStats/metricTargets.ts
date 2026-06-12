import type { VisibilityState } from '@tanstack/react-table'
import { StatsOperation } from '@shared/api/generated'

export type MetricTarget = {
  field: string // column or dot-path for JSONB, e.g. 'status' / 'attrib.fps'
  aggregations: StatsOperation[]
}

export type StatsEntity = 'folder' | 'task' | 'product' | 'version'

// matches both MetricTarget[] and the codegen'd single-or-array variables type
type TargetsArg = { targets?: { field: string }[] | { field: string } | null }
const targetFields = (arg?: TargetsArg): { field: string }[] => {
  const t = arg?.targets
  return Array.isArray(t) ? t : t ? [t] : []
}

// refetch only when a target was added — hiding a column needs no query
export const hasNewTargetFields = (current?: TargetsArg, previous?: TargetsArg): boolean => {
  if (!current) return false
  if (!previous) return true
  const prevFields = new Set(targetFields(previous).map((t) => t.field))
  return targetFields(current).some((t) => !prevFields.has(t.field))
}

const COUNTS: StatsOperation[] = [StatsOperation.Filled, StatsOperation.NotFilled]
// FILLED rides along so combined-scope averages can be weighted exactly
const NUMERIC: StatsOperation[] = [
  StatsOperation.Min,
  StatsOperation.Max,
  StatsOperation.Avg,
  StatsOperation.Sum,
  StatsOperation.Filled,
  StatsOperation.NotFilled,
]
// enum columns: counts power the fallback display, distribution the colored bar
const ENUM: StatsOperation[] = [
  StatsOperation.Filled,
  StatsOperation.NotFilled,
  StatsOperation.Distribution,
]

// The table's unified subType column per entity (result columnName maps back
// to subType via COLUMN_ALIASES in columnStats).
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
// JSONB), and list-type attribs.
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
  if (isVisible('tags')) targets.push({ field: 'tags', aggregations: ENUM })
  if (entity === 'task' && isVisible('assignees')) {
    targets.push({ field: 'assignees', aggregations: ENUM })
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

    const field = `inherited_attributes.${attrib.name}`
    const type = attrib.data?.type
    if (type === 'integer' || type === 'float') {
      targets.push({ field, aggregations: NUMERIC })
    } else if (type === 'string') {
      targets.push({ field, aggregations: attrib.data?.enum?.length ? ENUM : COUNTS })
    }
  }

  return targets
}
