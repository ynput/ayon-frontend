import { AttributeEnumItem, AttributeModel } from '@api/rest/attributes'

export const getPriorityOptions = (
  priority: AttributeModel | undefined,
): AttributeEnumItem[] | undefined => {
  // ensure the priority is in scope of
  if (!priority?.scope?.includes('task') || priority?.name !== 'priority') {
    return undefined
  }
  return priority.data.enum || []
}
