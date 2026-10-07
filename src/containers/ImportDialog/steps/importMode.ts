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

export const duplicateStrategyOptions: {
  value: DuplicateItemStrategy
  label: string
  icon: 'block' | 'done_all'
}[] = [
  { value: 'skip', label: 'Skip the row', icon: 'block' },
  { value: 'all', label: 'Update all of them', icon: 'done_all' },
]

// Only folders and tasks are matched by name, which can repeat across the hierarchy
export const hasDuplicateStrategy = (importContext: ImportContext, importMode: ImportMode) =>
  importContext === 'hierarchy' && importMode === ImportMode.UPDATE_ONLY

// Whether hierarchy rows say their own entity type, or the whole sheet is one type
export type RowsEntityType = 'column' | 'folder' | 'task'

export const rowsEntityTypeOptions: {
  value: RowsEntityType
  label: string
  icon: 'view_column' | 'folder' | 'task_alt'
}[] = [
  { value: 'column', label: 'From a column', icon: 'view_column' },
  { value: 'folder', label: 'All folders', icon: 'folder' },
  { value: 'task', label: 'All tasks', icon: 'task_alt' },
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
  entity_list_item: ['folder_path', 'entity_id'],
}

const ENTITY_LIST_ID = 'entity_list_id'

export const hasImportModes = (importContext: ImportContext) =>
  Boolean(matchTargetsForImportContext[importContext])

export const describeImportMode = (importContext: ImportContext, importMode: ImportMode) => {
  const updateOnly = importMode === ImportMode.UPDATE_ONLY
  if (importContext === 'entity_list_item') {
    return updateOnly
      ? 'Rows update the attributes of items already in the list, matched by entity path or ID. ' +
          'Entities that are not in the list are skipped.'
      : 'Rows add entities to the list and update the attributes of items already in it.'
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
// The parent is the folder or list the dialog was opened for.
export const getRequiredTargetGroups = (
  importContext: ImportContext,
  importMode: ImportMode,
  importSchema: ImportSchema,
  mappings?: ColumnMappings,
  parentId?: string,
): string[][] => {
  const matchTargets = matchTargetsForImportContext[importContext]

  if (importContext === 'entity_list_item' && matchTargets) {
    return parentId ? [matchTargets] : [matchTargets, [ENTITY_LIST_ID]]
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
  parentId?: string,
) => {
  const mappedTargets = getMappedTargets(mappings)
  return getRequiredTargetGroups(
    importContext,
    importMode,
    importSchema,
    mappings,
    parentId,
  ).filter((group) => !group.some((target) => mappedTargets.has(target)))
}
