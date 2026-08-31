import type { AttributeModel } from '@shared/api'
import { ProjectTableAttribute } from '../../ProjectTreeTable/hooks/useAttributesList'
import { SliceFilter, SliceType } from '../types'
import { RowSelectionState } from '@tanstack/react-table'

export type SliceSelection = { sliceType: SliceType; rowSelection: RowSelectionState }

export type CreateFilterFromSlicer = ({
  slice,
  attribFields,
}: {
  slice: SliceSelection | null
  attribFields: ProjectTableAttribute[]
}) => SliceFilter | null

export const createFilterFromSlicer: CreateFilterFromSlicer = ({ slice, attribFields }) => {
  const sliceFilterTypes = {
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
    }, {} as Record<string, AttributeModel['data']['type']>),
  }

  const filter: SliceFilter | null = (() => {
    if (!slice) return null
    const sliceType = sliceFilterTypes[slice?.sliceType as keyof typeof sliceFilterTypes]

    const values = Object.keys(slice.rowSelection)
      .filter((sliceId) => !!sliceId)
      .map((sliceId) => ({
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
