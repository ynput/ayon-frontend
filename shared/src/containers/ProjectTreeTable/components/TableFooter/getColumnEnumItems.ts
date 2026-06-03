import { BuiltInFieldOptions, ProjectTableAttribute, AttributeEnumItem } from '../../types'

// Returns the enum options that back an enum-type column (built-in or attribute),
// used to build the proportion bar distribution.
export const getColumnEnumItems = (
  columnId: string,
  attribs: ProjectTableAttribute[],
  options: BuiltInFieldOptions,
): AttributeEnumItem[] => {
  if (columnId === 'status') return options.status || []
  if (columnId === 'tags') return options.tag || []
  if (columnId === 'subType') {
    return [...(options.folderType || []), ...(options.taskType || [])]
  }
  if (columnId.startsWith('attrib_')) {
    const name = columnId.replace('attrib_', '')
    return attribs.find((a) => a.name === name)?.data.enum || []
  }
  return []
}
