import { DuplicateItemStrategy, MissingItemStrategy } from '@shared/api/generated/dataImport'
import {
  ColumnAction,
  ColumnMappings,
  ImportContext,
  ImportSchema,
  itemsLabelForImportContext,
} from './common'
import { ENTITY_TYPE, FOLDER_TASK_TYPE_COMBINED_COLUMN, FOLDER_TYPE, TASK_TYPE } from './hierarchy'

export enum ImportMode {
  CREATE_AND_UPDATE = 'createAndUpdate',
  UPDATE_ONLY = 'updateOnly',
}

export const importModeOptions = [
  { value: ImportMode.CREATE_AND_UPDATE, label: 'Create and update', icon: 'add_circle' },
  { value: ImportMode.UPDATE_ONLY, label: 'Update only', icon: 'edit' },
] as const

export const missingStrategyForImportMode: Record<ImportMode, MissingItemStrategy> = {
  [ImportMode.CREATE_AND_UPDATE]: 'create',
  [ImportMode.UPDATE_ONLY]: 'skip',
}

export const getDuplicateStrategyOptions = (
  importContext: ImportContext,
): { value: DuplicateItemStrategy; label: string; icon: 'block' | 'done_all' }[] => [
  { value: 'skip', label: 'Skip the row', icon: 'block' },
  {
    value: 'all',
    label: importContext === 'entity_list_item' ? 'Use all of them' : 'Update all of them',
    icon: 'done_all',
  },
]

// Names can repeat across the hierarchy. Folders and tasks match by name only when updating,
// list items always can.
export const hasDuplicateStrategy = (importContext: ImportContext, importMode: ImportMode) =>
  importContext === 'entity_list_item' ||
  (importContext === 'hierarchy' && importMode === ImportMode.UPDATE_ONLY)

export const describeDuplicateStrategy = (importContext: ImportContext) =>
  importContext === 'entity_list_item'
    ? 'When a Name matches several entities and there is no Path or ID to tell them apart.'
    : 'When a Name matches several folders or tasks and there is no Path to tell them apart.'

// Where a list import puts values: on the listed entities (like the Overview import), or on
// the list items, shown only in the list. Only attributes can be kept on the list items.
export const listValuesOptions: {
  value: boolean
  label: string
  icon: 'edit' | 'list'
}[] = [
  { value: true, label: 'Update the entities', icon: 'edit' },
  { value: false, label: 'Only in this list', icon: 'list' },
]

export const describeListValues = (updateListedEntities: boolean) =>
  updateListedEntities
    ? 'Status, attributes and other values are set on the entities, like in the Overview.'
    : 'Attribute values are stored on the list items and shown only in this list.'

// entity values a list item can't hold, offered only when updating the entities
const LISTED_ENTITY_FIELDS = [
  'label',
  'status',
  'tags',
  'assignees',
  'active',
  'folder_type',
  'task_type',
  'product_type',
]

export const schemaForListValues = (importSchema: ImportSchema, updateListedEntities: boolean) =>
  updateListedEntities
    ? importSchema
    : importSchema.filter(({ key }) => !LISTED_ENTITY_FIELDS.includes(key))

// The entity type of a list created by the import
export type NewListEntityType = 'folder' | 'task' | 'product' | 'version'

export const newListEntityTypeOptions: {
  value: NewListEntityType
  label: string
  icon: 'folder' | 'check_circle' | 'inventory_2' | 'layers'
}[] = [
  { value: 'folder', label: 'Folders', icon: 'folder' },
  { value: 'task', label: 'Tasks', icon: 'check_circle' },
  { value: 'product', label: 'Products', icon: 'inventory_2' },
  { value: 'version', label: 'Versions', icon: 'layers' },
]

export const describeNewList = (entityType: NewListEntityType) =>
  entityType === 'version'
    ? 'A new list gets the versions the rows find by ID, and their values are updated.'
    : `A new list gets the ${entityType}s the rows find by path, name or ID, and their values are updated.`

// Whether hierarchy rows say their own entity type, or the whole sheet is one type
export type RowsEntityType = 'column' | 'folder' | 'task'

export const rowsEntityTypeOptions: {
  value: RowsEntityType
  label: string
  icon: 'view_column' | 'folder' | 'check_circle'
}[] = [
  { value: 'column', label: 'From a column', icon: 'view_column' },
  { value: 'folder', label: 'All folders', icon: 'folder' },
  { value: 'task', label: 'All tasks', icon: 'check_circle' },
]

export const describeRowsEntityType = (rowsEntityType: RowsEntityType, importMode: ImportMode) => {
  if (rowsEntityType === 'folder') return 'Every row is a folder.'
  if (rowsEntityType === 'task') return 'Every row is a task.'
  return importMode === ImportMode.UPDATE_ONLY
    ? 'An Entity type column says if a row is a folder or a task. ' +
        'Without it, rows take the type of what they match.'
    : 'An Entity type column says if a row is a folder or a task.'
}

// Targets that don't apply when the whole sheet is one entity type
const hiddenTargetsForRowsEntityType: Record<RowsEntityType, string[]> = {
  column: [],
  folder: [ENTITY_TYPE, FOLDER_TASK_TYPE_COMBINED_COLUMN, TASK_TYPE],
  task: [ENTITY_TYPE, FOLDER_TASK_TYPE_COMBINED_COLUMN, FOLDER_TYPE],
}

export const schemaForRowsEntityType = (
  importSchema: ImportSchema,
  rowsEntityType: RowsEntityType,
) => {
  const hidden = hiddenTargetsForRowsEntityType[rowsEntityType]
  return importSchema.filter(({ key }) => !hidden.includes(key))
}

// Targets that identify an existing entity, any one of them is enough.
const matchTargetsForImportContext: Partial<Record<ImportContext, string[]>> = {
  hierarchy: ['path', 'name'],
  user: ['name'],
  entity_list_item: ['folder_path', 'name', 'entity_id'],
}

// The dialog imports into the list it was opened for, or into a new one
export const ENTITY_LIST_ID = 'entity_list_id'

export const hasImportModes = (importContext: ImportContext) =>
  Boolean(matchTargetsForImportContext[importContext])

export const describeImportMode = (importContext: ImportContext, importMode: ImportMode) => {
  const updateOnly = importMode === ImportMode.UPDATE_ONLY
  if (importContext === 'entity_list_item') {
    return updateOnly
      ? 'Rows update the entities already in the list and their list attributes, matched by ' +
          'entity path, name or ID. Entities that are not in the list are skipped.'
      : 'Rows add entities to the list and update their values and list attributes.'
  }

  const items = itemsLabelForImportContext[importContext]
  if (updateOnly) {
    const matchHint =
      importContext === 'hierarchy' ? 'by Path, or by Name when there is no path' : 'by name'
    return `Rows update existing ${items}, matched ${matchHint}. Rows that match nothing are skipped.`
  }

  return `Rows update existing ${items} and create the ones that don't exist yet.`
}

export const templateForImport = (importContext: ImportContext, importMode: ImportMode) =>
  importContext === 'hierarchy' && importMode === ImportMode.UPDATE_ONLY
    ? 'ayon_import_hierarchy_update_template.csv'
    : `ayon_import_${importContext}_template.csv`

const getMappedTargets = (mappings: ColumnMappings = {}) =>
  new Set(
    Object.values(mappings)
      .filter(({ action, targetColumn }) => action === ColumnAction.MAP && targetColumn)
      .map(({ targetColumn }) => targetColumn as string),
  )

// Each group lists targets of which at least one has to be mapped.
export const getRequiredTargetGroups = (
  importContext: ImportContext,
  importMode: ImportMode,
  importSchema: ImportSchema,
  mappings?: ColumnMappings,
): string[][] => {
  const matchTargets = matchTargetsForImportContext[importContext]

  if (importContext === 'entity_list_item' && matchTargets) {
    return [matchTargets]
  }

  if (importMode === ImportMode.CREATE_AND_UPDATE || !matchTargets) {
    return importSchema.filter(({ required }) => required).map(({ key }) => [key])
  }

  // the entity type is optional when updating, but needed to read a combined folder/task type
  if (
    importContext === 'hierarchy' &&
    getMappedTargets(mappings).has(FOLDER_TASK_TYPE_COMBINED_COLUMN)
  ) {
    return [matchTargets, [ENTITY_TYPE]]
  }

  return [matchTargets]
}

export const getUnmappedRequiredTargetGroups = (
  importContext: ImportContext,
  importMode: ImportMode,
  importSchema: ImportSchema,
  mappings?: ColumnMappings,
) => {
  const mappedTargets = getMappedTargets(mappings)
  return getRequiredTargetGroups(importContext, importMode, importSchema, mappings).filter(
    (group) => !group.some((target) => mappedTargets.has(target)),
  )
}
