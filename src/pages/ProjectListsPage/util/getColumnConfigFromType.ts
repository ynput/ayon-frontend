type StringStringArray = [string[], string[]]
type FunctionType = (entityType?: string) => StringStringArray

export const getColumnConfigFromType: FunctionType = (entityType) => {
  const hiddenDates = ['createdAt', 'updatedAt']
  switch (entityType) {
    case 'product':
      return [['assignees', 'subType', ...hiddenDates], ['attrib']] as StringStringArray
    case 'version':
      return [['assignees', 'subType', ...hiddenDates], ['attrib']] as StringStringArray
    case 'folder':
      return [['assignees', 'subType', ...hiddenDates], []] as StringStringArray
    case 'task':
      return [['subType', ...hiddenDates], []] as StringStringArray
    default:
      return [['subType', ...hiddenDates], []] as StringStringArray
  }
}
