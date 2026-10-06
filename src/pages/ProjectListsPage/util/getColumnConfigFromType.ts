import { LISTS_COLUMN_ID } from '@shared/containers/ProjectTreeTable'

type StringStringArray = [string[], string[]]
type FunctionType = (entityType?: string) => StringStringArray

export const getColumnConfigFromType: FunctionType = (entityType) => {
  switch (entityType) {
    case 'product':
      return [['assignees', 'subType', LISTS_COLUMN_ID], ['attrib']] as StringStringArray
    case 'version':
      return [['assignees', 'subType', LISTS_COLUMN_ID], ['attrib']] as StringStringArray
    case 'folder':
      return [['assignees', 'subType', LISTS_COLUMN_ID], []] as StringStringArray
    case 'task':
      return [['subType', LISTS_COLUMN_ID], []] as StringStringArray
    default:
      return [['subType', LISTS_COLUMN_ID], []] as StringStringArray
  }
}
