type StringStringArray = [string[], string[]]
type FunctionType = (entityType?: string) => StringStringArray

export const getColumnConfigFromType: FunctionType = (entityType) => {
  switch (entityType) {
    case 'product':
      return [['assignees'], ['attrib', 'subType']] as StringStringArray
    case 'version':
      return [['assignees', 'subType'], ['attrib']] as StringStringArray
    case 'folder':
      return [['assignees'], []] as StringStringArray
    case 'task':
      return [[], []] as StringStringArray
    default:
      return [[], []] as StringStringArray
  }
}
