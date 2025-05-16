import { ProjectTableAttribute } from '../types'

export const getReadOnlyLists = (attribFields: ProjectTableAttribute[], extra: string[] = []) => {
  let readOnlyAttribs: string[] = attribFields
    .filter((attrib) => attrib.readOnly) // Filter attributes that are explicitly readOnly
    .map((attrib) => attrib.name) // Extract the names of the readOnly attributes

  let readOnlyColumnsSet: Set<string>

  if (extra?.includes('attrib' as any)) {
    // If 'attrib' is in the readonly columns, all attributes are read-only
    readOnlyAttribs = attribFields.filter((a) => a.builtin).map((attrib) => attrib.name) // Mark all attributes as readOnly if they are builtin
    readOnlyColumnsSet = new Set([
      ...attribFields.filter((a) => a.builtin).map((attrib) => 'attrib_' + attrib.name), // Add all attribute columns to the readOnly set
      ...(extra || []), // Add any other specified readOnly columns
    ])
  } else {
    // If 'attrib' is not in the readonly columns, handle individual attributes
    readOnlyColumnsSet = new Set([
      ...readOnlyAttribs.map((name) => 'attrib_' + name), // Add readOnly attribute columns to the set
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

  const readOnlyColumns = Array.from(readOnlyColumnsSet) // Convert the set of readOnly columns to an array

  return { readOnlyColumns, readOnlyAttribs }
}
