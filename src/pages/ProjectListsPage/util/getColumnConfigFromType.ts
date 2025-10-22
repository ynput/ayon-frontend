type StringStringArray = [string[], string[]]
type FunctionType = (entityType?: string) => StringStringArray

export const getColumnConfigFromType: FunctionType = (entityType) => {
  switch (entityType) {
    case 'product':
      return [['assignees', 'subType', 'folder'], ['attrib']] as StringStringArray
    case 'version':
      return [['assignees', 'subType', 'folder'], ['attrib']] as StringStringArray
    case 'folder':
      return [['assignees', 'subType', 'folder'], []] as StringStringArray
    case 'task':
      return [['subType', 'folder'], []] as StringStringArray
    default:
      return [['subType', 'folder'], []] as StringStringArray
  }
}
