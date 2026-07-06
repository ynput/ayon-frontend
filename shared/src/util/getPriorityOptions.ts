import { EnumItem } from '@shared/api/generated/dataImport'
import { AttributeModel } from '@shared/api/generated/system'

type ScopeEntityType =
  | 'folder'
  | 'product'
  | 'version'
  | 'representation'
  | 'task'
  | 'workfile'
  | 'project'
  | 'user'

export const getPriorityOptions = (
  priority: AttributeModel | undefined,
  type: ScopeEntityType,
): EnumItem[] | undefined => {
  // ensure the priority is in scope of
  if (!priority?.scope?.includes(type) || priority?.name !== 'priority') {
    return undefined
  }
  return priority.data.enum || []
}
