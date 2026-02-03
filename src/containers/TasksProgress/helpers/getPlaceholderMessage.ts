import { SliceType } from '@shared/containers/Slicer'

export const getPlaceholderMessage = (sliceType: SliceType) => {
  let type = sliceType === 'hierarchy' ? 'folder' : sliceType
  //   remove any s from end of type
  const excludedTypes = ['status']
  if (!excludedTypes.includes(type)) {
    type = type.replace(/s$/, '')
  }
  return `No tasks found, try selecting another ${type} or expanding your filters.`
}
