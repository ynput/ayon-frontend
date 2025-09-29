import { ProjectTableAttribute } from '../types'

// Known built-in fields. We keep both camelCase and snake_case variants since
// permissions may use either form depending on the backend response.
const FIELD_VARIANTS: Record<string, string[]> = {
  name: ['name'],
  label: ['label'],
  status: ['status'],
  tags: ['tags'],
  assignees: ['assignees'],
  active: ['active'],
  parentId: ['parentId', 'parent_id'],
  folderType: ['folderType', 'folder_type'],
  taskType: ['taskType', 'task_type'],
  productType: ['productType', 'product_type'],
  author: ['author'],
}

export const getReadOnlyLists = (
  attribFields: ProjectTableAttribute[],
  writableFields: string[] | undefined,
  extra: string[] = [],
) => {
  let readOnlyAttribs: string[] = attribFields
    .filter((attrib) => attrib.readOnly) // Filter attributes that are explicitly readOnly
    .map((attrib) => attrib.name) // Extract the names of the readOnly attributes

  let readOnlyColumnsSet: Set<string>
  // Gather read-only built-in fields (non-attribute), based on provided writableFields
  const readOnlyFields: string[] = []
  let folderTypeReadOnly = false
  let taskTypeReadOnly = false
  if (writableFields?.length) {
    const writableSet = new Set(writableFields)
    const isWritable = (variants: string[]) => variants.some((v) => writableSet.has(v))

    Object.entries(FIELD_VARIANTS).forEach(([fieldId, variants]) => {
      const writable = isWritable(variants)
      if (!writable) {
        // Mark this built-in field as read-only
        readOnlyFields.push(fieldId)
        if (fieldId === 'folderType') folderTypeReadOnly = true
        if (fieldId === 'taskType') taskTypeReadOnly = true
      }
    })
  }

  if (extra?.includes('attrib' as any)) {
    // If 'attrib' is in the readonly columns, all attributes are read-only
    readOnlyAttribs = attribFields.filter((a) => a.builtin).map((attrib) => attrib.name) // Mark all attributes as readOnly if they are builtin
    readOnlyColumnsSet = new Set([
      ...attribFields.filter((a) => a.builtin).map((attrib) => 'attrib_' + attrib.name), // Add all attribute columns to the readOnly set
      ...readOnlyFields, // Also include read-only built-in fields
      ...(extra || []), // Add any other specified readOnly columns
    ])
  } else {
    // If 'attrib' is not in the readonly columns, handle individual attributes
    readOnlyColumnsSet = new Set([
      ...readOnlyAttribs.map((name) => 'attrib_' + name), // Add readOnly attribute columns to the set
      ...readOnlyFields, // Add read-only built-in fields to the set (field ids match column ids)
      ...(extra || []), // Add any other specified readOnly columns
    ])

    // Add readOnly from extra to attribs
    if (extra) {
      extra.forEach((col) => {
        if (col.startsWith('attrib_')) {
          const attribName = col.replace('attrib_', '')
          if (
            attribFields.find((attrib) => attrib.name === attribName) &&
            !readOnlyAttribs.includes(attribName)
          ) {
            readOnlyAttribs.push(attribName)
          }
        }
      })
    }
  }

  // If both folder type and task type are read-only, also add subType as read-only
  // This is a UI-combined field for folderType/taskType
  if (folderTypeReadOnly && taskTypeReadOnly) {
    readOnlyColumnsSet.add('subType')
    if (!readOnlyAttribs.includes('subType')) readOnlyAttribs.push('subType')
  }

  // Also add read-only built-in fields to readOnlyAttribs to expose a combined list
  // (Clipboard paste logic will still only enforce for attrib_ columns.)
  if (readOnlyFields.length) {
    for (const f of readOnlyFields) {
      if (!readOnlyAttribs.includes(f)) readOnlyAttribs.push(f)
    }
  }

  const readOnlyColumns = Array.from(readOnlyColumnsSet) // Convert the set of readOnly columns to an array

  return { readOnlyColumns, readOnlyAttribs }
}
