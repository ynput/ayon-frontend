import { ProjectTableAttribute } from '../../types'
import { SummaryKind } from './summaryTypes'

const ENUM_BUILTINS = new Set(['status', 'tags', 'subType'])
const DATETIME_BUILTINS = new Set(['createdAt', 'updatedAt'])
// Always-filled labels / non-aggregatable built-ins -> blank summary.
const BLANK_BUILTINS = new Set([
  'thumbnail',
  'folder',
  'entityType',
  'author',
  'version',
  'product',
  'path',
])

// Enum columns whose value is always set (status, type, priority, …) — a
// filled/empty split is meaningless there, only the value breakdown applies.
const ALWAYS_FILLED = new Set(['status', 'subType', 'productBaseType', 'attrib_priority'])

export const isAlwaysFilledColumn = (columnId: string): boolean => ALWAYS_FILLED.has(columnId)

export const classifyColumnSummary = (
  columnId: string,
  attribs: ProjectTableAttribute[],
): SummaryKind => {
  if (columnId === 'name') return 'main'
  if (columnId === 'assignees') return 'assignee'
  if (ENUM_BUILTINS.has(columnId)) return 'enum'
  if (DATETIME_BUILTINS.has(columnId)) return 'datetime'
  if (BLANK_BUILTINS.has(columnId)) return 'blank'

  if (columnId.startsWith('attrib_')) {
    const name = columnId.replace('attrib_', '')
    const attrib = attribs.find((a) => a.name === name)
    if (!attrib) return 'blank'
    const { type, enum: enumItems } = attrib.data
    if (enumItems?.length) return 'enum'
    if (type === 'integer' || type === 'float') return 'number'
    if (type === 'boolean') return 'boolean'
    if (type === 'datetime') return 'datetime'
    if (type === 'string') return 'text'
    return 'blank'
  }

  return 'blank'
}
