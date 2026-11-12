import type { VisibilityState } from '@tanstack/react-table'
import type { EnumItem, Status } from '@shared/api'
import {
  checkColumnVisibility,
  getColumnLabel,
  type EditorTaskNode,
  type MatchingFolder,
  type ProjectTableAttribute,
} from '@shared/containers/ProjectTreeTable'
import { formatUTCDate } from '@shared/util/formatUTCDate'
import { DATE_FORMAT, formatDate } from '@shared/util/formatDate'

export const EMPTY_FIELD_TEXT = '–'

type User = { name: string; fullName?: string }

type StaticFieldId = 'tags' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'

const STATIC_FIELD_IDS: StaticFieldId[] = [
  'tags',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
]

export type TaskField =
  | { id: StaticFieldId; label: string; kind: 'static'; options?: Map<string, TagOption> }
  | {
      id: string
      label: string
      kind: 'attrib'
      attribute: ProjectTableAttribute
      options: Map<string, EnumItem>
    }

type EnumOption = EnumItem & { colorLight?: string | null }

export type TagOption = { name: string; color?: string | null; colorLight?: string | null }

// colorLight comes with the light theme anatomy, before the generated types have it
export type StatusOption = Status & { colorLight?: string | null }

export type TaskFieldPill = {
  label: string
  icon?: string
  color: string
  colorLight?: string | null
}

export type TaskFieldValue = {
  id: string
  label: string
  text?: string
  pills?: TaskFieldPill[]
  boolean?: boolean
}

type ColumnState = {
  columnVisibility: VisibilityState
  columnOrder: string[]
  defaultColumnVisibility?: VisibilityState
  attribFields: ProjectTableAttribute[]
  scope?: 'task' | 'folder'
  tags?: TagOption[]
}

const isCardAttribute = (attribute: ProjectTableAttribute) =>
  attribute.data.type !== 'dict' && attribute.data.type !== 'list_of_submodels'

// every field a task or folder card can show, in definition order
export const getCardFieldCandidates = (
  attribFields: ProjectTableAttribute[],
  scope?: 'task' | 'folder',
  tags: TagOption[] = [],
): TaskField[] => [
  ...STATIC_FIELD_IDS.map(
    (id): TaskField => ({
      id,
      label: getColumnLabel(id),
      kind: 'static',
      options: id === 'tags' ? new Map(tags.map((tag) => [tag.name, tag])) : undefined,
    }),
  ),
  ...attribFields
    .filter(isCardAttribute)
    .filter(
      (attribute) =>
        !attribute.scope ||
        (scope
          ? attribute.scope.includes(scope)
          : attribute.scope.some((item) => item === 'task' || item === 'folder')),
    )
    .map(
      (attribute): TaskField => ({
        id: `attrib_${attribute.name}`,
        label: attribute.data.title || attribute.name,
        kind: 'attrib',
        attribute,
        options: new Map((attribute.data.enum ?? []).map((item) => [String(item.value), item])),
      }),
    ),
]

export const getColumnOrderIndex = (columnOrder: string[], id: string) => {
  const index = columnOrder.indexOf(id)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

// view columns follow the table: missing keys fall back to the default visibility
export const isCardFieldShown = (
  columnVisibility: VisibilityState,
  id: string,
  defaultColumnVisibility?: VisibilityState,
) =>
  !!Object.keys(columnVisibility).length &&
  checkColumnVisibility(columnVisibility, id, defaultColumnVisibility)

// null keeps the default fields: the view has no column choices of its own yet
export const getTaskFields = ({
  columnVisibility,
  columnOrder,
  defaultColumnVisibility,
  attribFields,
  scope = 'task',
  tags,
}: ColumnState): TaskField[] | null => {
  if (!Object.keys(columnVisibility).length) return null

  return getCardFieldCandidates(attribFields, scope, tags)
    .filter((field) => checkColumnVisibility(columnVisibility, field.id, defaultColumnVisibility))
    .map((field, definitionIndex) => ({ field, definitionIndex }))
    .sort(
      (a, b) =>
        getColumnOrderIndex(columnOrder, a.field.id) -
          getColumnOrderIndex(columnOrder, b.field.id) || a.definitionIndex - b.definitionIndex,
    )
    .map(({ field }) => field)
}

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)

// attribute dates are stored as UTC midnight, so they are shown in UTC to keep the day
const formatAttribDate = (value: unknown) => {
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return undefined
  return formatUTCDate(date, DATE_FORMAT)
}

const getAttribValue = (
  field: Extract<TaskField, { kind: 'attrib' }>,
  value: unknown,
): Omit<TaskFieldValue, 'id' | 'label'> | undefined => {
  const { type } = field.attribute.data
  if (type === 'boolean') return { boolean: value === true }
  if (type === 'datetime') {
    const text = formatAttribDate(value)
    return text ? { text } : undefined
  }

  const values = Array.isArray(value) ? value : [value]
  const items = values.map((item) => field.options.get(String(item)) as EnumOption | undefined)
  if (items.some((item) => item?.color)) {
    return {
      pills: values.map((item, index) => ({
        label: items[index]?.label ?? String(item),
        icon: typeof items[index]?.icon === 'string' ? (items[index]?.icon as string) : undefined,
        color: items[index]?.color || '',
        colorLight: items[index]?.colorLight,
      })),
    }
  }
  return { text: values.map((item, index) => items[index]?.label ?? String(item)).join(', ') }
}

const getStaticValue = (id: StaticFieldId, value: unknown, usersByName: Map<string, User>) => {
  if (id === 'createdAt' || id === 'updatedAt') return formatDate(value as string) || undefined
  if (id === 'createdBy' || id === 'updatedBy') {
    const user = usersByName.get(String(value))
    return user?.fullName || String(value)
  }
  return Array.isArray(value) ? value.join(', ') : String(value)
}

export const getTaskFieldValues = (
  task: EditorTaskNode | MatchingFolder,
  fields: TaskField[],
  usersByName: Map<string, User>,
  hideEmpty = true,
): TaskFieldValue[] =>
  fields.flatMap((field): TaskFieldValue[] => {
    const empty: TaskFieldValue[] = hideEmpty
      ? []
      : [{ id: field.id, label: field.label, text: EMPTY_FIELD_TEXT }]

    if (field.kind === 'static') {
      const value = task[field.id]
      if (isEmpty(value)) return empty
      if (field.options && Array.isArray(value)) {
        const pills = value.map((name: string) => {
          const tag = field.options?.get(name)
          return { label: name, color: tag?.color || '', colorLight: tag?.colorLight }
        })
        return [{ id: field.id, label: field.label, pills }]
      }
      const text = getStaticValue(field.id, value, usersByName)
      return text ? [{ id: field.id, label: field.label, text }] : empty
    }

    const value = task.attrib?.[field.attribute.name]
    if (isEmpty(value)) return empty
    const formatted = getAttribValue(field, value)
    return formatted ? [{ id: field.id, label: field.label, ...formatted }] : empty
  })

export const formatFrameRange = (attrib?: Record<string, any>) => {
  const { frameStart, frameEnd } = attrib ?? {}
  if (typeof frameStart !== 'number' || typeof frameEnd !== 'number') return undefined
  return `${frameStart}-${frameEnd}`
}

export const formatShortDate = (value?: string) => (value ? formatAttribDate(value) : undefined)
