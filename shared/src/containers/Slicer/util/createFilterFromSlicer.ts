import type { ProjectTableAttribute } from '../../ProjectTreeTable/hooks/useAttributesList'
import type { SliceFilter, SliceType } from '../types'
import type { Filter } from '@ynput/ayon-react-components'
import type { RowSelectionState } from '@tanstack/react-table'

export type SliceSelection = { sliceType: SliceType; rowSelection: RowSelectionState }

export type CreateFilterFromSlicer = ({
  slice,
  attribFields,
}: {
  slice: SliceSelection | null
  attribFields: ProjectTableAttribute[]
}) => SliceFilter | null

export const createFilterFromSlicer: CreateFilterFromSlicer = ({ slice, attribFields }) => {
  const sliceFilterTypes: Record<string, Filter['type']> = {
    assignees: 'list_of_strings',
    status: 'string',
    taskType: 'string',
    productType: 'string',
    author: 'string',
    hierarchy: undefined,
    entityList: undefined,
    ...attribFields.reduce((acc, field) => {
      // @ts-ignore
      acc['attrib.' + field.name] = field.data.type
      return acc
    }, {} as Record<string, Filter['type']>),
  }

  const filter: SliceFilter | null = (() => {
    if (!slice) return null
    const sliceType = sliceFilterTypes[slice?.sliceType]

    const values = Object.entries(slice.rowSelection)
      .filter(([sliceId, selected]) => !!sliceId && selected)
      .map(([sliceId]) => ({
        id: sliceId,
        label: sliceId,
      }))

    return {
      id: slice?.sliceType,
      label: slice?.sliceType,
      type: sliceType,
      inverted: false,
      operator: 'OR',
      values,
    }
  })()

  return filter
}

// value-dimension panels only; hierarchy and entityList contribute folder/entity ids instead
export const createFiltersFromSlicer = ({
  slices,
  attribFields,
}: {
  slices: SliceSelection[]
  attribFields: ProjectTableAttribute[]
}): SliceFilter[] =>
  slices
    .filter((slice) => slice.sliceType !== 'hierarchy' && slice.sliceType !== 'entityList')
    .map((slice) => createFilterFromSlicer({ slice, attribFields }))
    .filter((filter): filter is SliceFilter => !!filter)
