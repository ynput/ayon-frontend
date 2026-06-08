export * from './table'
export * from './overviewContext'
export * from './operations'

import { AttributeModel, EnumItem } from '@shared/api'
import { OperationModel } from './operations'

export interface ProjectTableAttribute extends Omit<AttributeModel, 'position'> {
  readOnly?: boolean
}

export type LoadingTasks = Record<string, number> // show number of loading tasks per folder or root

export type PatchOperation = Pick<OperationModel, 'entityId' | 'entityType' | 'data'> & {
  type?: OperationModel['type']
}

interface EnumOption extends EnumItem {
  scope?: string[]
}

export type TreeTableSubType = 'folderType' | 'taskType' | 'productType'
type BuiltInFieldOptionKey = TreeTableSubType | 'status' | 'assignee' | 'tag'

export type BuiltInFieldOptions = {
  [key in BuiltInFieldOptionKey]: EnumOption[]
}
