import { ReactNode } from 'react'
import { EntitiesMap } from '../../types/table'
import { AttributeEnumItem, BuiltInFieldOptions } from '../../types'

// Constants for field mappings
export const builtInFieldMappings = {
  status: 'statuses',
  folderType: 'folderTypes',
  taskType: 'taskTypes',
}

export interface ColumnEnums extends BuiltInFieldOptions {
  [attrib: string]: AttributeEnumItem[]
}
export type PasteMethod = 'replace' | 'merge'
export interface ClipboardContextType {
  copyToClipboard: (selected?: string[], fullRow?: boolean) => Promise<void>
  pasteFromClipboard: (selected: string[], config?: { method?: PasteMethod }) => Promise<void>
  exportCSV: (selected: string[], projectName: string, fullRow?: boolean) => void
}

export interface ClipboardProviderProps {
  children: ReactNode
  entitiesMap: EntitiesMap
  columnEnums: ColumnEnums
  columnReadOnly: string[]
}

export interface ParsedClipboardData {
  values: string[]
  colIds: string[]
}
