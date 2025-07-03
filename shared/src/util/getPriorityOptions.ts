import { AttributeEnumItem, AttributeModel } from '@shared/api'

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
): AttributeEnumItem[] | undefined => {
  // ensure the priority is in scope of
  if (!priority?.scope?.includes(type) || priority?.name !== 'priority') {
    return undefined
  }
  return priority.data.enum || []
}
