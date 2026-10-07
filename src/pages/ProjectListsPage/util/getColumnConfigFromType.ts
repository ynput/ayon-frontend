import { LIST_COLUMN_IDS } from '@shared/containers/ProjectTreeTable'

type StringStringArray = [string[], string[]]
type FunctionType = (entityType?: string) => StringStringArray

export const getColumnConfigFromType: FunctionType = (entityType) => {
  switch (entityType) {
    case 'product':
      return [['assignees', 'subType', ...LIST_COLUMN_IDS], ['attrib']] as StringStringArray
    case 'version':
      return [['assignees', 'subType', ...LIST_COLUMN_IDS], ['attrib']] as StringStringArray
    case 'folder':
      return [['assignees', 'subType', ...LIST_COLUMN_IDS], []] as StringStringArray
    case 'task':
      return [['subType', ...LIST_COLUMN_IDS], []] as StringStringArray
    default:
      return [['subType', ...LIST_COLUMN_IDS], []] as StringStringArray
  }
}
