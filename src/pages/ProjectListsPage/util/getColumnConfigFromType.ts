type StringStringArray = [string[], string[]]
type FunctionType = (entityType?: string) => StringStringArray

export const getColumnConfigFromType: FunctionType = (entityType) => {
  switch (entityType) {
    // a version's built-in attributes are locked per row by the table (isEntityAttribLocked)
    case 'product':
    case 'version':
    case 'folder':
      return [['assignees', 'subType'], []] as StringStringArray
    case 'task':
      return [['subType'], []] as StringStringArray
    default:
      return [['subType'], []] as StringStringArray
  }
}
