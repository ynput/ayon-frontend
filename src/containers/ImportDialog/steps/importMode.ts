import { MissingItemStrategy } from '@shared/api/generated/dataImport'
import {
  ColumnAction,
  ColumnMappings,
  ImportContext,
  ImportSchema,
  itemsLabelForImportContext,
} from './common'
import { ENTITY_TYPE, FOLDER_TASK_TYPE_COMBINED_COLUMN } from './hierarchy'

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

// Targets that identify an existing entity in update-only mode, any one of them is enough.
// List items can only be added, so they have no update-only mode.
const matchTargetsForImportContext: Partial<Record<ImportContext, string[]>> = {
  hierarchy: ['path', 'name'],
  user: ['name'],
}

export const hasImportModes = (importContext: ImportContext) =>
  Boolean(matchTargetsForImportContext[importContext])

const matchHintForImportContext: Partial<Record<ImportContext, string>> = {
  hierarchy: 'by Path, or by Name when there is no path',
  user: 'by name',
}

export const describeImportMode = (importContext: ImportContext, importMode: ImportMode) => {
  const items = itemsLabelForImportContext[importContext]
  if (importMode === ImportMode.UPDATE_ONLY) {
    return (
      `Rows update existing ${items}, matched ${matchHintForImportContext[importContext]}. ` +
      'Rows that match nothing are skipped.'
    )
  }

  return `Rows update existing ${items} and create the ones that don't exist yet.`
}

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
