import { ReactNode } from 'react'
import { FolderNodeMap, TaskNodeMap } from '../../utils/types'
import { AttributeEnumItem } from '@api/rest/attributes'
import { BuiltInFieldOptions } from '../../../../containers/ProjectTreeTable/ProjectTreeTableColumns'

// Constants for field mappings
export const builtInFieldMappings = {
  status: 'statuses',
  folderType: 'folderTypes',
  taskType: 'taskTypes',
}

export interface ColumnEnums extends BuiltInFieldOptions {
  [attrib: string]: AttributeEnumItem[]
}

export interface ClipboardContextType {
  copyToClipboard: (selected?: string[], fullRow?: boolean) => Promise<void>
  pasteFromClipboard: (selected?: string[]) => Promise<void>
  exportCSV: (selected: string[], projectName: string, fullRow?: boolean) => void
}

export interface ClipboardProviderProps {
  children: ReactNode
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  columnEnums: ColumnEnums
  columnReadOnly: string[]
}

export interface ParsedClipboardData {
  values: string[]
  colIds: string[]
}
