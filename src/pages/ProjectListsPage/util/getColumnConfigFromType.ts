type StringStringArray = [string[], string[]]
type FunctionType = (entityType?: string) => StringStringArray

export const getColumnConfigFromType: FunctionType = (entityType) => {
  switch (entityType) {
    case 'product':
      return [['assignees', 'subType'], ['attrib']] as StringStringArray
    case 'version':
      return [['assignees', 'subType'], ['attrib']] as StringStringArray
    case 'folder':
      return [['assignees', 'subType'], []] as StringStringArray
    case 'task':
      return [['subType'], []] as StringStringArray
    default:
      return [['subType'], []] as StringStringArray
  }
}
