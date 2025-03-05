import { ReactNode } from 'react'
import { FolderNodeMap, TaskNodeMap } from '../../types'
import { AttributeEnumItem } from '@api/rest/attributes'
import { BuiltInFieldOptions } from '../../TableColumns'

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
  copyToClipboard: () => Promise<void>
  pasteFromClipboard: () => Promise<void>
}

export interface ClipboardProviderProps {
  children: ReactNode
  foldersMap: FolderNodeMap
  tasksMap: TaskNodeMap
  columnEnums: ColumnEnums
}

export interface ParsedClipboardData {
  values: string[]
  colIds: string[]
}
