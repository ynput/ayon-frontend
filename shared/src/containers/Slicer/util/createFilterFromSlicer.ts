import { AttributeModel } from '@shared/api'
import { ProjectTableAttribute } from '../../ProjectTreeTable/hooks/useAttributesList'
import { SelectionData, SliceFilter, SliceType } from '../types'

export type CreateFilterFromSlicer = ({
  slice,
  attribFields,
}: {
  slice: { sliceType: SliceType; rowSelectionData: SelectionData } | null
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

    const selectedItems = Object.values(slice?.rowSelectionData)
    const values = selectedItems.map((item) => ({
      id: item.id,
      label: item.label || item.name || '',
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
