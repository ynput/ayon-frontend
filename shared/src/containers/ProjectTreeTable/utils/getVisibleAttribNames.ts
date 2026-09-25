import type { SortingState, VisibilityState } from '@tanstack/react-table'
import { checkColumnVisibility } from './checkColumnVisibility'

type GetVisibleAttribNamesArgs = {
  attribFields: { name: string }[]
  columnVisibility: VisibilityState
  defaultColumnVisibility?: VisibilityState
  // sorted columns need their values even when hidden
  sorting?: SortingState
  // attributes needed without a visible column, e.g. the group by attribute
  include?: (string | undefined)[]
  // `attrib_` for the row entity, `<scope>_attrib_` for parent entity columns
  columnIdPrefixes?: string[]
}

// Names of the attributes to request with `attrib(names: $attribNames)`:
// a hidden column never needs its values. Sorted so the query cache key stays stable.
export const getVisibleAttribNames = ({
  attribFields,
  columnVisibility,
  defaultColumnVisibility,
  sorting = [],
  include = [],
  columnIdPrefixes = ['attrib_'],
}: GetVisibleAttribNamesArgs): string[] => {
  const sortedColumnIds = sorting.map(({ id }) => id)
  const isNeeded = (name: string) =>
    include.includes(name) ||
    columnIdPrefixes.some(
      (prefix) =>
        sortedColumnIds.includes(prefix + name) ||
        checkColumnVisibility(columnVisibility, prefix + name, defaultColumnVisibility),
    )

  return [...new Set(attribFields.map(({ name }) => name).filter(isNeeded))].sort()
}

// `attrib.fps` group by id -> `fps`
export const getAttribNameFromFieldId = (fieldId?: string): string | undefined =>
  fieldId?.startsWith('attrib.') ? fieldId.slice('attrib.'.length) : undefined
