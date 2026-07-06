import { AttributeModel, FolderListItem } from '@shared/api'
import { ProjectTableAttribute } from '../../ProjectTreeTable/hooks/useAttributesList'
import { SliceFilter, SliceType } from '../types'
import { RowSelectionState } from '@tanstack/react-table'

export type CreateFilterFromSlicer = ({
  slice,
  attribFields,
}: {
  slice: { sliceType: SliceType; rowSelection: RowSelectionState } | null
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
